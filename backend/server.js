import dotenv from "dotenv"
dotenv.config();

import app from "./src/app.js"
import connectDB from "./src/config/db.js"

// Start BullMQ workers on boot
import "./src/workers/incident.worker.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
            console.log(`🔧 BullMQ workers started`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();