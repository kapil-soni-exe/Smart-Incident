import IncidentModel from "../model/incident.models.js";

// ─── GET /api/v1/incidents ────────────────────────────────────────────────────
export const getIncidents = async (req, res) => {
  try {
    const { service, severity, status, page = 1, limit = 20, search } = req.query;

    // Build dynamic query from filters
    const query = {};
    if (service) query.service = service;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    // Full-text search on title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Fetch paginated results sorted by most recent first
    const [incidents, total] = await Promise.all([
      IncidentModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      IncidentModel.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: incidents,
    });
  } catch (err) {
    console.error("getIncidents error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch incidents" });
  }
};

// ─── GET /api/v1/incidents/:id ────────────────────────────────────────────────
export const getIncidentById = async (req, res) => {
  try {
    const incident = await IncidentModel.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: "Incident not found" });
    }
    res.status(200).json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch incident" });
  }
};

// ─── PATCH /api/v1/incidents/:id/status ──────────────────────────────────────
export const updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["open", "investigating", "resolved", "closed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${allowed.join(", ")}` });
    }

    const incident = await IncidentModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ success: false, error: "Incident not found" });
    }

    res.status(200).json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update status" });
  }
};

// ─── GET /api/v1/incidents/stats ─────────────────────────────────────────────
export const getIncidentStats = async (req, res) => {
  try {
    // Aggregate counts by status and severity in parallel
    const [statusCounts, severityCounts, recentTrend] = await Promise.all([
      // Count incidents grouped by status
      IncidentModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // Count incidents grouped by severity
      IncidentModel.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
      // Last 7 days — daily incident count
      IncidentModel.aggregate([
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
      data: { statusCounts, severityCounts, recentTrend },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
};
