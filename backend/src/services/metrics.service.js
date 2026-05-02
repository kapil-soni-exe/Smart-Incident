import client from "prom-client";

// Enable default metrics collection (CPU, Memory, etc.)
client.collectDefaultMetrics({ prefix: "opusguard_" });

// 1. Total Errors Counter
export const errorCounter = new client.Counter({
  name: "opusguard_errors_total",
  help: "Total number of errors received by the platform",
  labelNames: ["service", "severity", "environment"],
});

// 2. Total Incidents Counter
export const incidentCounter = new client.Counter({
  name: "opusguard_incidents_total",
  help: "Total number of incidents promoted from errors",
  labelNames: ["service", "severity"],
});

// 3. HTTP Request Duration Histogram
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "code"],
  buckets: [10, 50, 100, 300, 500, 1000, 3000], // buckets in milliseconds
});

// 4. BullMQ Metrics
export const queueJobsWaitingGauge = new client.Gauge({
  name: "opusguard_queue_jobs_waiting",
  help: "Number of jobs currently waiting in the queue",
  labelNames: ["queue"],
});

export const queueJobsCompletedCounter = new client.Counter({
  name: "opusguard_queue_jobs_completed_total",
  help: "Total number of completed background jobs",
  labelNames: ["queue"],
});

export const queueJobsFailedCounter = new client.Counter({
  name: "opusguard_queue_jobs_failed_total",
  help: "Total number of failed background jobs",
  labelNames: ["queue"],
});

export const getJsonMetrics = async () => {
  return await client.register.getMetricsAsJSON();
};

export const register = client.register;
