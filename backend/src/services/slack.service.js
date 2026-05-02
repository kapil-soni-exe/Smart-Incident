import { config } from "../config/config.js";

/**
 * sendSlackAlert — posts a formatted incident notification to Slack
 * Called from the incidentQueue worker when a new incident is created
 * @param {Object} incident — the incident document from MongoDB
 */
export const sendSlackAlert = async (incident) => {
  // Skip if webhook URL is not configured
  if (!config.SLACK_WEBHOOK_URL) {
    console.warn("⚠️  Slack webhook not configured — skipping notification");
    return;
  }

  // Severity → emoji mapping for visual scanning in Slack
  const severityEmoji = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    critical: "🔴",
  };

  const emoji = severityEmoji[incident.severity] || "⚪";
  const timestamp = new Date(incident.createdAt).toISOString();

  // Build Slack Block Kit payload for rich formatting
  const payload = {
    text: `${emoji} *New Incident Created* — ${incident.title}`, // Fallback text for notifications
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} Incident Alert — OpusGuard`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Title:*\n${incident.title}` },
          { type: "mrkdwn", text: `*Service:*\n${incident.service}` },
          { type: "mrkdwn", text: `*Severity:*\n${incident.severity.toUpperCase()}` },
          { type: "mrkdwn", text: `*Status:*\n${incident.status}` },
          { type: "mrkdwn", text: `*Error Count:*\n${incident.errorCount}` },
          { type: "mrkdwn", text: `*Created At:*\n${timestamp}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description:*\n${incident.description || "No description provided"}`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Fingerprint: \`${incident.fingerprint}\` | Sent by *OpusGuard*`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(config.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`✅ Slack alert sent for incident: ${incident.title}`);
  } catch (error) {
    console.error("❌ Failed to send Slack alert:", error.message);
  }
};
