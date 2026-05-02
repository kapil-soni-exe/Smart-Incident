import { config } from "../config/config.js";

/**
 * Redis connection options used by BullMQ
 * BullMQ requires a raw ioredis-compatible connection config — NOT a URL string
 * We parse the REDIS_URL from env and extract host/port/password
 */
let redisConnection;

try {
  const url = new URL(config.REDIS_URL);

  redisConnection = {
    host: url.hostname,                          // e.g. redis-17719.crce217...
    port: Number(url.port) || 6379,             // e.g. 17719
    password: url.password || undefined,         // auth password
    username: url.username || undefined,         // e.g. "default"
    tls: url.protocol === "rediss:" ? {} : undefined, // TLS if rediss://
    maxRetriesPerRequest: null,                  // Required by BullMQ
    enableReadyCheck: false,                     // Prevents stall on connect
  };

  console.log(`🔗 Redis connection configured: ${url.hostname}:${url.port}`);
} catch (err) {
  // Fallback to localhost if URL is malformed
  console.warn("⚠️  Could not parse REDIS_URL — falling back to localhost:6379");
  redisConnection = {
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

export default redisConnection;
