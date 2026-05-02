import { Router } from "express";
import { register, login, getMe, regenerateApiKey } from "../contollers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes — no auth needed
router.post("/register", register);          // Create account
router.post("/login", login);                // Get JWT token

// Protected routes — requires valid JWT
router.get("/me", authenticate, getMe);                            // Get current user
router.post("/regenerate-key", authenticate, regenerateApiKey);    // Get new API key

export default router;
