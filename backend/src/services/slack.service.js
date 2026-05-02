import { config } from "../config/config.js";

/**
 * Severity to emoji mapping for Slack messages
 */
const SEVERITY_EMOJI = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
};

/**
 * Sends a formatted Slack alert when a new incident is created.
 * Uses Slack Block Kit for rich formatting.
 *
 * @param {Object} incidentData - The incident details
 * @param {string} incidentData.title - Incident title
 * @param {string} incidentData.service - Affected service name
 * @param {string} incidentData.severity - Severity level (low/medium/high/critical)
 * @param {string} incidentData.fingerprint - Error fingerprint hash
 * @param {number} incidentData.errorCount - Number of error occurrences
 * @returns {Promise<boolean>} - true if alert sent successfully, false otherwise
 */
export const sendSlackAlert = async (incidentData) => {
    const webhookUrl = config.SLACK_WEBHOOK_URL;

    // Gracefully skip if Slack webhook is not configured
    if (!webhookUrl) {
        console.warn("⚠️  Slack webhook URL not configured — skipping alert");
        return false;
    }

    const { title, service, severity, fingerprint, errorCount } = incidentData;
    const emoji = SEVERITY_EMOJI[severity] || "⚪";
    const timestamp = new Date().toISOString();

    // Slack Block Kit payload for rich formatting
    const payload = {
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `🚨 New Incident Alert`,
                    emoji: true,
                },
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Title:*\n${title}`,
                    },
                    {
                        type: "mrkdwn",
                        text: `*Service:*\n\`${service}\``,
                    },
                    {
                        type: "mrkdwn",
                        text: `*Severity:*\n${emoji} ${severity.toUpperCase()}`,
                    },
                    {
                        type: "mrkdwn",
                        text: `*Error Count:*\n${errorCount}`,
                    },
                ],
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `🔑 Fingerprint: \`${fingerprint}\` | 🕐 ${timestamp}`,
                    },
                ],
            },
            {
                type: "divider",
            },
        ],
    };

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Slack API responded with status ${response.status}`);
        }

        console.log(`📨 Slack alert sent for incident: ${title}`);
        return true;
    } catch (error) {
        console.error("❌ Failed to send Slack alert:", error.message);
        return false;
    }
};
