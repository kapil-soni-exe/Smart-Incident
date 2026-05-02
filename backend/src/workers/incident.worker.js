import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { sendSlackAlert } from "../services/slack.service.js";
import { getAISuggestion } from "../services/openai.service.js";
import IncidentModel from "../model/incident.models.js";

/**
 * Incident Worker — processes jobs from the incidentQueue.
 *
 * For each new incident, this worker:
 * 1. Sends a Slack alert notification
 * 2. Gets an AI-powered fix suggestion from OpenAI
 * 3. Updates the Incident document with the AI suggestion
 *
 * Retry policy: 3 attempts with exponential backoff (2s, 4s, 8s)
 */
const incidentWorker = new Worker(
    "incidentQueue",
    async (job) => {
        const { incidentId, title, service, severity, fingerprint, errorCount, stack, message } = job.data;

        console.log(`\n🔧 Processing incident job: ${job.id}`);
        console.log(`   📋 Title: ${title}`);
        console.log(`   🏷️  Service: ${service}`);
        console.log(`   ⚡ Severity: ${severity}`);

        // Step 1: Send Slack Alert
        const slackResult = await sendSlackAlert({
            title,
            service,
            severity,
            fingerprint,
            errorCount,
        });

        // Step 2: Get AI Fix Suggestion
        const aiSuggestion = await getAISuggestion(stack, message, service);

        // Step 3: Update Incident with AI Suggestion
        if (aiSuggestion) {
            try {
                await IncidentModel.findByIdAndUpdate(incidentId, {
                    $set: { aiSuggestion },
                });
                console.log(`✅ Incident ${incidentId} updated with AI suggestion`);
            } catch (dbError) {
                console.error(`❌ Failed to update incident ${incidentId}:`, dbError.message);
                throw dbError; // Re-throw to trigger retry
            }
        }

        // Return job result for logging/debugging
        return {
            incidentId,
            slackSent: slackResult,
            aiSuggestionGenerated: !!aiSuggestion,
        };
    },
    {
        connection: redisConnection,
        concurrency: 5, // Process up to 5 jobs simultaneously
    }
);

// Worker event listeners for monitoring
incidentWorker.on("completed", (job, result) => {
    console.log(`✅ Incident job ${job.id} completed:`, result);
});

incidentWorker.on("failed", (job, error) => {
    console.error(`❌ Incident job ${job?.id} failed (attempt ${job?.attemptsMade}):`, error.message);
});

incidentWorker.on("error", (error) => {
    console.error("❌ Incident worker error:", error.message);
});

console.log("🔧 Incident worker started — listening for jobs...");

export default incidentWorker;
