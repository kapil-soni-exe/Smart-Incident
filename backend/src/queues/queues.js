import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

/**
 * Default job options for all queues.
 * - 3 retry attempts with exponential backoff
 * - Jobs are removed after completion to save memory
 */
const defaultJobOptions = {
    attempts: 3,
    backoff: {
        type: "exponential",
        delay: 2000, // starts at 2s, then 4s, then 8s
    },
    removeOnComplete: {
        count: 100, // keep last 100 completed jobs for debugging
    },
    removeOnFail: {
        count: 200, // keep last 200 failed jobs for debugging
    },
};

/**
 * Incident Queue — processes new incidents:
 * 1. Sends Slack alert notification
 * 2. Gets AI-powered fix suggestion from OpenAI
 * 3. Updates the incident with the AI suggestion
 */
export const incidentQueue = new Queue("incidentQueue", {
    connection: redisConnection,
    defaultJobOptions,
});

/**
 * Email Queue — placeholder for future email notifications.
 * Can be used for sending email alerts, reports, digests, etc.
 */
export const emailQueue = new Queue("emailQueue", {
    connection: redisConnection,
    defaultJobOptions,
});

console.log("📦 BullMQ queues initialized: incidentQueue, emailQueue");
