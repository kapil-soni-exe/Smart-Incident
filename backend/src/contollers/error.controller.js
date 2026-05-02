import ErrorModel from "../model/erros.models.js";
import mongoose from "mongoose";
import IncidentModel from "../model/incident.models.js";
import crypto from "crypto";
import { incidentQueue } from "../queues/index.js"; // BullMQ producer
import { errorCounter, incidentCounter } from "../services/metrics.service.js";
import { getIO } from "../config/socket.js";

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

    // Track error count in Prometheus
    errorCounter.labels(service, severity || "low", environment || "prod").inc();

    if (!message || !service) {
      return res
        .status(400)
        .json({ success: false, error: "Message and Service are required" });
    }

    // 1. Normalize Message — strip numeric IDs for consistent grouping
    //    e.g. "User 123 failed" → "User  failed"
    const normalizedMessage = message.replace(/\d+/g, "").trim();

    // 2. Generate Fingerprint via MD5 (normalization + service + operation + projectId)
    //    Fingerprint is now unique PER PROJECT
    const base = normalizedMessage + service + (operation || "") + req.project._id;
    const fingerprint = crypto.createHash("md5").update(base).digest("hex");

    // 3. Time Window — only aggregate errors seen within the last minute
    const oneMinuteAgo = new Date(Date.now() - 60000);

    // 4. Aggregation — find an existing active error group in the time window
    let incident = await ErrorModel.findOneAndUpdate(
      {
        projectId: req.project._id,
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
        projectId: req.project._id,
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

    // 6. Threshold Check — use project-defined threshold (defaults to 10)
    const THRESHOLD = req.project.alertThreshold || 10;
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
          projectId: req.project._id,
          title: `Frequent Error: ${incident.message}`,
          description: `Error occurred ${incident.count} times in a short window.`,
          service: incident.service,
          severity: incident.severity,
          fingerprint: incident.fingerprint,
          errorCount: incident.count,
          tags: incident.tags,
        });

        isIncidentCreated = true;

        // Track incident promotion in Prometheus
        incidentCounter.labels(newIncident.service, newIncident.severity).inc();

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

    // 8. Emit Real-Time Event via WebSockets
    const io = getIO();
    if (io) {
      io.emit("new_error", {
        message: incident.message,
        service: incident.service,
        severity: incident.severity,
        environment: incident.environment,
        count: incident.count,
        timestamp: new Date().toISOString()
      });
    }

    // 9. Respond immediately — queue handles async processing
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
    // Each user/project should only see THEIR data
    const projectId = req.user._id; // Or req.project._id depending on auth flow

    const [total, bySeverity, last7Days] = await Promise.all([
      // Total active errors for this project
      ErrorModel.countDocuments({ projectId, status: "active" }),

      // Group by severity for this project
      ErrorModel.aggregate([
        { $match: { projectId } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),

      // Daily error count over the past 7 days for this project
      ErrorModel.aggregate([
        {
          $match: {
            projectId,
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
      data: { 
        total, 
        bySeverity, 
        last7Days,
        projectInfo: { id: projectId }
      },
    });
  } catch (error) {
    console.error("Stats Fetch Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch error stats" });
  }
};

// ─── GET /api/v1/errors/trend — minute-by-minute trend ───────────────────────
export const getTrendData = async (req, res) => {
  try {
    const projectId = req.user._id;
    const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);

    const trend = await ErrorModel.aggregate([
      {
        $match: {
          projectId,
          createdAt: { $gte: sixtyMinutesAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%H:%M", date: "$createdAt" },
          },
          count: { $sum: 1 },
          critical: {
            $sum: {
              $cond: [
                { $in: ["$severity", ["critical", "high"]] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, data: trend });
  } catch (error) {
    console.error("Trend Fetch Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch trend data" });
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
