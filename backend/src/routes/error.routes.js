// Adds GET /api/v1/errors/:id route to the existing error routes
import { Router } from "express";
import { logError, getErrors, getErrorStats, getErrorById, getTrendData } from "../contollers/error.controller.js";
import { authenticate, validateApiKey } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/v1/errors — authenticated via SDK API key
router.post("/", validateApiKey, logError);

// GET — require dashboard authentication
router.get("/stats", authenticate, getErrorStats); // Stats summary — must be before /:id
router.get("/trend", authenticate, getTrendData);  // Historical minute trend
router.get("/",      authenticate, getErrors);      // Paginated list
router.get("/:id",   authenticate, getErrorById);   // Single error by ID

export default router;
