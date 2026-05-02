import { getJsonMetrics } from "../services/metrics.service.js";

export const getSystemHealth = async (req, res) => {
  try {
    const metrics = await getJsonMetrics();
    
    // Extract key info for frontend (Latency, Queues)
    const stats = {
      httpLatency: metrics.find(m => m.name === "http_request_duration_ms")?.values || [],
      queueHealth: metrics.filter(m => m.name.startsWith("opusguard_queue_")),
      totalErrors: metrics.find(m => m.name === "opusguard_errors_total")?.values || [],
    };

    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch health metrics" });
  }
};
