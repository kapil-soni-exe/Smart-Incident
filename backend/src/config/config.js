import dotenv from "dotenv";
dotenv.config();

// ─── Validate critical environment variables at startup ───────────────────────
const required = ["MONGO_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

// ─── Centralised config object — import this wherever you need env values ─────
export const config = {
  // Server
  PORT: process.env.PORT || 5000,

  // Database
  MONGO_URI: process.env.MONGO_URI, // MongoDB connection string

  // Redis — used by BullMQ for queue brokering
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  // OpenAI — used to generate AI fix suggestions from stack traces
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  // Slack — incoming webhook for incident alerts
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,

  // JWT — secret for signing/verifying auth tokens
  JWT_SECRET: process.env.JWT_SECRET,

  // CORS — allowed origin for cross-origin requests
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
};