import mongoose from "mongoose";
import crypto from "crypto"

const errorSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: false, // Optional for now
    index: true
  },
  message: { type: String, required: true },

  service: { type: String, required: true }, // payments/auth/api
  operation: { type: String }, // specific function/API

  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "low"
  },

  source: {
    type: String,
    enum: ["frontend", "backend"]
  },

  statusCode: Number,

  fingerprint: String, // 🔥 unique hash for grouping

  stack: String,

  aiSuggestion: {
    type: String,
    default: ""
  },

  metadata: {
    userId: String,
    requestId: String,
    ip: String,
    userAgent: String
  },

  environment: {
    type: String,
    enum: ["dev", "staging", "prod"],
    default: "prod"
  },

  tags: [String], // ["db", "timeout"]

  count: {
    type: Number,
    default: 1
  },

  firstSeen: {
    type: Date,
    default: Date.now
  },

  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },

  status: {
    type: String,
    enum: ["active", "resolved", "ignored"],
    default: "active",
    index: true
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // Auto-cleanup after 30 days (TTL index)
  }
});

// Compound index for fast aggregation lookup
errorSchema.index({ fingerprint: 1, status: 1, lastSeen: -1 });

errorSchema.pre("save", function() {
    const base = this.message + this.service + (this.operation || "");
    this.fingerprint = crypto
    .createHash("md5")
    .update(base)
    .digest("hex");
});

errorSchema.index({ service: 1 });
errorSchema.index({ severity: 1 });

const ErrorModel = mongoose.model("Error", errorSchema);
export default ErrorModel;