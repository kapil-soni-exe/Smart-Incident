import jwt from "jsonwebtoken";
import crypto from "crypto";
import UserModel from "../model/user.model.js";
import ProjectModel from "../model/project.model.js";
import { config } from "../config/config.js";

// Helper: create a signed JWT valid for 7 days
const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  );

// Helper: generate a secure random API key prefixed with "sirp_"
const generateApiKey = () =>
  "sirp_" + crypto.randomBytes(24).toString("hex");

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    // Prevent duplicate accounts
    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }

    // Auto-assign unique API key on registration
    const apiKey = generateApiKey();

    const user = await UserModel.create({ name, email, password, apiKey });
    
    // 🚀 NEW: Create a default project for the user automatically
    await ProjectModel.create({
      name: "My First Project",
      owner: user._id,
      apiKey: apiKey,
      platform: "web"
    });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, apiKey: user.apiKey, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
};

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password required" });
    }

    // Find user and explicitly select password (excluded by default)
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = signToken(user);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, apiKey: user.apiKey, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Login failed" });
  }
};

// ─── GET /api/v1/auth/me ─────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    // req.user is set by authenticate middleware
    const user = await UserModel.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
};

// ─── POST /api/v1/auth/regenerate-key ────────────────────────────────────────
export const regenerateApiKey = async (req, res) => {
  try {
    const newKey = generateApiKey();
    const user = await UserModel.findByIdAndUpdate(
      req.user.id,
      { $set: { apiKey: newKey } },
      { new: true }
    ).select("-password");

    res.status(200).json({ success: true, apiKey: newKey, user });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to regenerate API key" });
  }
};
