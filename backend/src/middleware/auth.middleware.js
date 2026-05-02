import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

/**
 * authenticate middleware — validates JWT from Authorization header
 * Attaches decoded user payload to req.user for downstream handlers
 */
export const authenticate = (req, res, next) => {
  // Extract token from "Bearer <token>" header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify signature and expiry
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

/**
 * optionalAuth — same as authenticate but does NOT block unauthenticated requests
 * Useful for routes that work both publicly and with auth (e.g. public status page)
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(authHeader.split(" ")[1], config.JWT_SECRET);
    } catch {
      // Invalid token — treat as unauthenticated (don't block)
    }
  }
  next();
};
import ProjectModel from "../model/project.model.js";

/**
 * validateApiKey — for SDK ingestion (x-api-key header)
 * Finds the project associated with the key and attaches to request
 */
export const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ success: false, error: "API Key required (x-api-key header)" });
  }

  try {
    const project = await ProjectModel.findOne({ apiKey, status: "active" });
    if (!project) {
      return res.status(401).json({ success: false, error: "Invalid or inactive API Key" });
    }

    // Attach project info to request
    req.project = project; 
    next();
  } catch (err) {
    return res.status(500).json({ success: false, error: "Authentication service failure" });
  }
};
