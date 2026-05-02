import ErrorModel from "../model/erros.models.js";
import mongoose from "mongoose";
import IncidentModel from "../model/incident.models.js";
import crypto from "crypto";
import { incidentQueue } from "../queues/index.js"; // BullMQ producer

// ─── POST /api/v1/errors ──────────────────────────────────────────────────────
export const logError = async (req, res) => {
  try {
    const {
      message,
      service,
      operation,
      severity,
      source,
      statusCode,
      stack,
      metadata,
      environment,
      tags,
    } = req.body;

    if (!message || !service) {
      return res
        .status(400)
        .json({ success: false, error: "Message and Service are required" });
    }

    // 1. Normalize Message — strip numeric IDs for consistent grouping
    //    e.g. "User 123 failed" → "User  failed"
    const normalizedMessage = message.replace(/\d+/g, "").trim();

    // 2. Generate Fingerprint via MD5 (normalization + service + operation)
    const base = normalizedMessage + service + (operation || "");
    const fingerprint = crypto.createHash("md5").update(base).digest("hex");

    // 3. Time Window — only aggregate errors seen within the last minute
    const oneMinuteAgo = new Date(Date.now() - 60000);

    // 4. Aggregation — find an existing active error group in the time window
    let incident = await ErrorModel.findOneAndUpdate(
      {
        fingerprint,
        status: "active",
        lastSeen: { $gte: oneMinuteAgo },
      },
      {
        $inc: { count: 1 },
        $set: { lastSeen: new Date(), stack, metadata, statusCode },
      },
      { new: true }
    );

    let statusResponse = "Aggregated";

    // 5. No recent group found — create a fresh error record
    if (!incident) {
      incident = await ErrorModel.create({
        message,
        service,
        operation,
        severity: severity || "low",
        source,
        fingerprint,
        metadata,
        stack,
        statusCode,
        environment: environment || "prod",
        tags: tags || [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        status: "active",
      });
      statusResponse = "New";
    }

    // 6. Threshold Check — promote to Incident if count ≥ 10
    const THRESHOLD = 10;
    let isIncidentCreated = false;

    if (incident.count >= THRESHOLD) {
      // Avoid duplicate incidents for the same fingerprint
      const existingIncident = await IncidentModel.findOne({
        fingerprint: incident.fingerprint,
        status: { $in: ["open", "investigating"] },
      });

      if (!existingIncident) {
        // Create the incident document
        const newIncident = await IncidentModel.create({
          title: `Frequent Error: ${incident.message}`,
          description: `Error occurred ${incident.count} times in a short window.`,
          service: incident.service,
          severity: incident.severity,
          fingerprint: incident.fingerprint,
          errorCount: incident.count,
          tags: incident.tags,
        });

        isIncidentCreated = true;
        console.log(`🚨 Incident Created: ${newIncident._id}`);

        // 7. Enqueue async work — AI suggestion + Slack alert (non-blocking)
        await incidentQueue.add("process-incident", {
          incidentId: newIncident._id.toString(),
          errorMessage: incident.message,
          stack: incident.stack,
          service: incident.service,
        });

        console.log(`📬 Enqueued job for incident ${newIncident._id}`);
      } else {
        // Update existing incident error count and timestamp
        existingIncident.errorCount = incident.count;
        existingIncident.lastOccurrence = new Date();
        await existingIncident.save();
      }
    }

    // 8. Respond immediately — queue handles async processing
    res.status(201).json({
      success: true,
      fingerprint: incident.fingerprint,
      count: incident.count,
      status: statusResponse,
      incidentTriggered: isIncidentCreated,
    });
  } catch (error) {
    console.error("Production Error Processor Failure:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ─── GET /api/v1/errors ───────────────────────────────────────────────────────
export const getErrors = async (req, res) => {
  try {
    const {
      service,
      severity,
      status,
      environment,
      search,
      sortBy = "lastSeen",
      page = 1,
      limit = 25,
    } = req.query;

    // Build dynamic filter query
    const query = {};
    if (service) query.service = service;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (environment) query.environment = environment;

    // Search by error message
    if (search) {
      query.message = { $regex: search, $options: "i" };
    }

    const sortOptions = { [sortBy]: -1 }; // Descending sort
    const skip = (Number(page) - 1) * Number(limit);

    const [errors, total] = await Promise.all([
      ErrorModel.find(query).sort(sortOptions).skip(skip).limit(Number(limit)),
      ErrorModel.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: errors,
    });
  } catch (error) {
    console.error("Error fetching errors:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ─── GET /api/v1/errors/stats — dashboard summary ────────────────────────────
export const getErrorStats = async (req, res) => {
  try {
    const [total, bySeverity, last7Days] = await Promise.all([
      // Total active errors
      ErrorModel.countDocuments({ status: "active" }),

      // Group by severity
      ErrorModel.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),

      // Daily error count over the past 7 days
      ErrorModel.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: { total, bySeverity, last7Days },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch error stats" });
  }
};

// ─── GET /api/v1/errors/:id ───────────────────────────────────────────────────
export const getErrorById = async (req, res) => {
  try {
    // Validate ObjectId format before querying to avoid CastError
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid error ID" });
    }

    const error = await ErrorModel.findById(req.params.id);
    if (!error) {
      return res.status(404).json({ success: false, error: "Error not found" });
    }

    res.status(200).json({ success: true, data: error });
  } catch (err) {
    console.error("getErrorById error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch error" });
  }
};
