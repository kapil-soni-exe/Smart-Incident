import ErrorModel from "../model/erros.models.js";
import IncidentModel from "../model/incident.models.js";
import crypto from "crypto";

export const logError = async (req, res) => {
    try {
        const { message, service, operation, severity, source, statusCode, stack, metadata, environment, tags } = req.body;

        if (!message || !service) {
            return res.status(400).json({ success: false, error: "Message and Service are required" });
        }

        // 1. Normalize Message (Remove numbers/IDs for better grouping)
        // Example: "User 123 failed" -> "User failed"
        const normalizedMessage = message.replace(/\d+/g, "").trim();

        // 2. Generate Fingerprint (Normalization + Hashing)
        const base = normalizedMessage + service + (operation || "");
        const fingerprint = crypto
            .createHash("md5")
            .update(base)
            .digest("hex");

        // 3. Time Window Check (1 minute)
        const oneMinuteAgo = new Date(Date.now() - 60000);

        // 4. Aggregation Logic
        // Find an "active" incident with same fingerprint that happened in the last 1 minute
        let incident = await ErrorModel.findOneAndUpdate(
            { 
                fingerprint, 
                status: "active", 
                lastSeen: { $gte: oneMinuteAgo } 
            },
            { 
                $inc: { count: 1 },
                $set: { 
                    lastSeen: new Date(),
                    stack,
                    metadata,
                    statusCode
                }
            },
            { new: true }
        );

        let statusResponse = "Aggregated";

        // 5. If no recent incident exists, create a new one
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
                status: "active"
            });
            statusResponse = "New";
        }

        // 6. Decision Layer: Error -> Incident Transition
        const THRESHOLD = 10;
        let isIncidentCreated = false;

        if (incident.count >= THRESHOLD) {
            // Check if an open incident already exists for this fingerprint
            const existingIncident = await IncidentModel.findOne({ 
                fingerprint: incident.fingerprint, 
                status: { $in: ["open", "investigating"] } 
            });

            if (!existingIncident) {
                await IncidentModel.create({
                    title: `Frequent Error: ${incident.message}`,
                    description: `Error occurred ${incident.count} times in a short window.`,
                    service: incident.service,
                    severity: incident.severity,
                    fingerprint: incident.fingerprint,
                    errorCount: incident.count,
                    tags: incident.tags
                });
                isIncidentCreated = true;
                console.log(`🚨 Incident Created for fingerprint: ${incident.fingerprint}`);
            } else {
                // Update existing incident with latest count and timestamp
                existingIncident.errorCount = incident.count;
                existingIncident.lastOccurrence = new Date();
                await existingIncident.save();
            }
        }

        // 7. Response
        res.status(201).json({
            success: true,
            fingerprint: incident.fingerprint,
            count: incident.count,
            status: statusResponse,
            incidentTriggered: isIncidentCreated
        });

    } catch (error) {
        console.error("Production Error Processor Failure:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

export const getErrors = async (req, res) => {
    try {
        const { service, severity, status, environment, sortBy = "lastSeen" } = req.query;

        // Build Query
        const query = {};
        if (service) query.service = service;
        if (severity) query.severity = severity;
        if (status) query.status = status;
        if (environment) query.environment = environment;

        // Sorting Logic
        const sortOptions = {};
        sortOptions[sortBy] = -1; // Default to descending

        const errors = await ErrorModel.find(query)
            .sort(sortOptions)
            .limit(50); // Pagination basic limit

        res.status(200).json({
            success: true,
            count: errors.length,
            data: errors
        });
    } catch (error) {
        console.error("Error fetching incidents:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};
