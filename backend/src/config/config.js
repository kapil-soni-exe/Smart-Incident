import dotenv from "dotenv";
dotenv.config();

// ─── Validate critical environment variables at startup ───────────────────────
const required = ["MONGO_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

export const config = {
    MONGO_URI: process.env.MONGO_URI,
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
}
