import { Router } from "express";
import {
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  getIncidentStats,
} from "../contollers/incident.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All incident routes require authentication
router.use(authenticate);

router.get("/stats", getIncidentStats);            // Dashboard stats — must be before /:id
router.get("/", getIncidents);                     // Paginated list with filters
router.get("/:id", getIncidentById);               // Single incident detail
router.patch("/:id/status", updateIncidentStatus); // Update status (open/resolved/etc.)

export default router;
