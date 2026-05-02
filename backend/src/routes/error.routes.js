// Adds GET /api/v1/errors/:id route to the existing error routes
import { Router } from "express";
import { logError, getErrors, getErrorStats, getErrorById } from "../contollers/error.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/v1/errors — open to SDK
router.post("/", logError);

// GET — require dashboard authentication
router.get("/stats", authenticate, getErrorStats); // Stats summary — must be before /:id
router.get("/",      authenticate, getErrors);      // Paginated list
router.get("/:id",   authenticate, getErrorById);   // Single error by ID

export default router;
