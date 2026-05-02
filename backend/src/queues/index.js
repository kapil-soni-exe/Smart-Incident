import { Queue, Worker } from "bullmq";
import redisConnection from "./connection.js";
import { sendSlackAlert } from "../services/slack.service.js";
import { getAISuggestion } from "../services/openai.service.js";
import IncidentModel from "../model/incident.models.js";
import ErrorModel from "../model/erros.models.js";
import { 
  queueJobsWaitingGauge, 
  queueJobsCompletedCounter, 
  queueJobsFailedCounter 
} from "../services/metrics.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// INCIDENT QUEUE — triggered when error count ≥ threshold
// ─────────────────────────────────────────────────────────────────────────────

// Queue producer: other parts of the app push jobs here
export const incidentQueue = new Queue("incidentQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,                        // Retry failed jobs up to 3 times
    backoff: { type: "exponential", delay: 2000 }, // Wait 2s, 4s, 8s between retries
    removeOnComplete: 100,              // Keep last 100 completed jobs for audit
    removeOnFail: 50,                   // Keep last 50 failed jobs for debugging
  },
});

// Queue consumer: processes each incident job asynchronously
export const incidentWorker = new Worker(
  "incidentQueue",
  async (job) => {
    const { incidentId, errorMessage, stack, service } = job.data;

    console.log(`⚙️  [incidentQueue] Processing job ${job.id} — incident: ${incidentId}`);

    // Step 1: Fetch the incident from DB
    const incident = await IncidentModel.findById(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found in DB`);
    }

    // Step 2: Generate AI suggestion from the stack trace
    const aiSuggestion = await getAISuggestion(errorMessage, stack, service);
    incident.aiSuggestion = aiSuggestion; // Store AI suggestion on incident
    await incident.save();
    console.log(`🤖 AI suggestion saved to incident ${incidentId}`);

    // Step 3: Also persist aiSuggestion on the parent error group (fingerprint-based)
    await ErrorModel.updateMany(
      { fingerprint: incident.fingerprint },
      { $set: { aiSuggestion } }
    );

    // Step 4: Send Slack notification with incident details
    await sendSlackAlert(incident);
  },
  { connection: redisConnection, concurrency: 5 } // Process up to 5 jobs simultaneously
);

// Log worker lifecycle events and track metrics
incidentWorker.on("completed", (job) => {
  console.log(`✅ [incidentQueue] Job ${job.id} completed`);
  queueJobsCompletedCounter.labels("incidentQueue").inc();
});

incidentWorker.on("failed", (job, err) => {
  console.error(`❌ [incidentQueue] Job ${job.id} failed:`, err.message);
  queueJobsFailedCounter.labels("incidentQueue").inc();
});

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL QUEUE — reserved for future email notification feature
// ─────────────────────────────────────────────────────────────────────────────

export const emailQueue = new Queue("emailQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
});

// Email worker — processes email notification jobs
export const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { to, subject, body } = job.data;
    // TODO: Integrate nodemailer or SendGrid here
    console.log(`📧 [emailQueue] Would send email to ${to} — Subject: ${subject}`);
  },
  { connection: redisConnection }
);

emailWorker.on("completed", (job) => {
  console.log(`✅ [emailQueue] Email job ${job.id} done`);
  queueJobsCompletedCounter.labels("emailQueue").inc();
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ [emailQueue] Email job ${job.id} failed:`, err.message);
  queueJobsFailedCounter.labels("emailQueue").inc();
});

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE MONITORING POLLING — Update waiting counts every 15s
// ─────────────────────────────────────────────────────────────────────────────

setInterval(async () => {
  try {
    const [incidentWaiting, emailWaiting] = await Promise.all([
      incidentQueue.getWaitingCount(),
      emailQueue.getWaitingCount(),
    ]);
    queueJobsWaitingGauge.labels("incidentQueue").set(incidentWaiting);
    queueJobsWaitingGauge.labels("emailQueue").set(emailWaiting);
  } catch (err) {
    console.error("Failed to update queue metrics:", err.message);
  }
}, 15000);

console.log("🚀 BullMQ queues initialised: incidentQueue, emailQueue");
