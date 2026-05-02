import dotenv from "dotenv";
dotenv.config(); // Load env vars FIRST before any other imports

import http from "http";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/config/socket.js";

// Import queues to start BullMQ workers when server boots
import "./src/queues/index.js";

const PORT = process.env.PORT || 5000;

// Wrap Express app with HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const startServer = async () => {
  try {
    await connectDB(); // Connect to MongoDB before accepting requests
    console.log("✅ MongoDB connected");

    server.listen(PORT, () => {
      console.log(`🚀 OpusGuard backend running on http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server initialized`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();