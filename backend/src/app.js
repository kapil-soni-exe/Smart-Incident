import express from "express";
import morgan from "morgan";
import cors from "cors";
import { config } from "./config/config.js";

const app = express();

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use(morgan("dev")); // Log HTTP requests in colourful dev format

// ─── CORS — allow frontend origin to call the API ─────────────────────────────
app.use(
  cors({
    origin: config.FRONTEND_URL,       // e.g. http://localhost:5173
    credentials: true,                 // Allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
import errorRoutes from "./routes/error.routes.js";
import authRoutes from "./routes/auth.routes.js";
import incidentRoutes from "./routes/incident.routes.js";

app.use("/api/v1/errors", errorRoutes);         // Error ingestion + listing
app.use("/api/v1/auth", authRoutes);            // Register / Login / Me
app.use("/api/v1/incidents", incidentRoutes);   // Incident management

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);

// ─── 404 Fallback ────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found` })
);

export default app;
