import IORedis from "ioredis";
import { config } from "./config.js";

/**
 * Shared Redis connection for BullMQ queues and workers.
 * Uses REDIS_URL from environment, falls back to localhost.
 */
const redisConnection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
});

redisConnection.on("connect", () => {
    console.log("✅ Redis connected successfully");
});

redisConnection.on("error", (err) => {
    console.error("❌ Redis connection error:", err.message);
});

export default redisConnection;
