import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from './src/model/user.model.js';

dotenv.config();

const dummyErrors = [
  {
    message: "TypeError: Cannot read properties of undefined (reading 'map')",
    service: "frontend-app",
    severity: "high",
    source: "frontend",
    environment: "prod",
    stack: "TypeError: Cannot read properties of undefined (reading 'map')\n    at RenderItems (items.jsx:42:25)\n    at React.render (react-dom.js:124:42)",
    operation: "items.jsx:42",
    tags: ["react", "unhandled-error", "ui"],
    metadata: { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", url: "https://app.opusguard.com/dashboard" }
  },
  {
    message: "RedisConnectionError: Failed to connect to Redis at redis:6379",
    service: "worker-queue",
    severity: "critical",
    source: "backend",
    environment: "prod",
    stack: "RedisConnectionError: Failed to connect to Redis at redis:6379\n    at RedisClient.connect (redis.js:88:12)\n    at BullMQ.init (queue.js:12:3)",
    operation: "bullmq-init",
    tags: ["infrastructure", "redis", "bullmq"],
    metadata: { host: "worker-node-01" }
  },
  {
    message: "StripeCardDeclined: Your card was declined.",
    service: "billing-api",
    severity: "medium",
    source: "backend",
    environment: "prod",
    stack: "StripeCardDeclined: Your card was declined.\n    at Stripe.createCharge (stripe.js:122:15)\n    at PaymentController.process (payment.js:45:20)",
    operation: "POST /api/checkout",
    tags: ["billing", "stripe", "user-error"],
    metadata: { userId: "usr_12345", amount: 4900, currency: "usd" }
  },
  {
    message: "Error: Request failed with status code 502",
    service: "api-gateway",
    severity: "critical",
    source: "backend",
    environment: "prod",
    stack: "Error: Request failed with status code 502\n    at Axios.request (axios.js:104:15)\n    at ProxyService.forward (proxy.js:22:10)",
    operation: "proxy.js:22",
    tags: ["network", "timeout", "upstream"],
    metadata: { upstream: "inventory-service" }
  },
  {
    message: "MongoNetworkError: connection 0 to cluster0-shard-00-00.mongodb.net:27017 closed",
    service: "auth-service",
    severity: "critical",
    source: "backend",
    environment: "prod",
    stack: "MongoNetworkError: connection 0 to cluster0-shard-00-00.mongodb.net:27017 closed\n    at Connection.close (connection.js:120:12)",
    operation: "db-connect",
    tags: ["database", "mongodb", "connection"],
    metadata: { collection: "users" }
  },
  {
    message: "SyntaxError: Unexpected token < in JSON at position 0",
    service: "frontend-app",
    severity: "low",
    source: "frontend",
    environment: "prod",
    stack: "SyntaxError: Unexpected token < in JSON at position 0\n    at JSON.parse (<anonymous>)\n    at fetchUserData (api.js:45:18)",
    operation: "api.js:45",
    tags: ["parsing", "api-response"],
    metadata: { url: "https://app.opusguard.com/api/user/profile" }
  },
  {
    message: "Error: Invalid JWT token provided",
    service: "auth-service",
    severity: "medium",
    source: "backend",
    environment: "prod",
    stack: "Error: Invalid JWT token provided\n    at verifyToken (jwt.js:33:11)\n    at authMiddleware (auth.js:15:10)",
    operation: "authMiddleware",
    tags: ["auth", "jwt", "security"],
    metadata: { ip: "192.168.1.100" }
  },
  {
    message: "MemoryLimitExceeded: Process out of memory",
    service: "data-pipeline",
    severity: "high",
    source: "backend",
    environment: "prod",
    stack: "MemoryLimitExceeded: Process out of memory\n    at Array.push (<anonymous>)\n    at processData (pipeline.js:88:22)",
    operation: "processData",
    tags: ["oom", "performance", "pipeline"],
    metadata: { memoryUsage: "1024MB" }
  }
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  
  console.log("Fetching a user...");
  const user = await UserModel.findOne();
  if (!user) {
    console.log("No user found in DB. Please create one first.");
    process.exit(1);
  }

  console.log(`Found user ${user.email}. API Key: ${user.apiKey}`);

  console.log("Sending dummy errors...");
  const numErrors = 25; // Send 25 random errors
  let sent = 0;

  for (let i = 0; i < numErrors; i++) {
    const errorTemplate = dummyErrors[Math.floor(Math.random() * dummyErrors.length)];
    
    try {
      const res = await fetch('http://localhost:5000/api/v1/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': user.apiKey
        },
        body: JSON.stringify(errorTemplate)
      });
      
      if (res.ok) {
        sent++;
        console.log(`✅ Sent error: ${errorTemplate.message.substring(0, 40)}...`);
      } else {
        const text = await res.text();
        console.log(`❌ Failed to send error: ${res.status} ${text}`);
      }
    } catch (e) {
      console.log(`❌ Network error: ${e.message}`);
    }

    // Wait a short bit to spread them out slightly (though it doesn't matter too much)
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n🎉 Seed complete! Successfully sent ${sent}/${numErrors} dummy errors.`);
  console.log("The backend BullMQ workers will process them into incidents shortly.");
  
  mongoose.disconnect();
}

seed().catch(console.error);
