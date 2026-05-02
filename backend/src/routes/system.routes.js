import { Router } from "express";
import { getSystemHealth } from "../contollers/system.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/health", authenticate, getSystemHealth);

export default router;
