import dotenv from "dotenv";
dotenv.config(); // Load env vars FIRST before any other imports

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

// Import queues to start BullMQ workers when server boots
// Workers register themselves on import (incidentQueue + emailQueue workers)
import "./src/queues/index.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB(); // Connect to MongoDB before accepting requests
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 OpusGuard backend running on http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();