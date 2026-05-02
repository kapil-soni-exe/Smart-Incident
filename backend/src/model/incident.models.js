import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },

  description: String,

  service: {
    type: String,
    required: true,
  },

  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },

  status: {
    type: String,
    enum: ["open", "investigating", "resolved", "closed"],
    default: "open",
  },

  fingerprint: {
    type: String,
    required: true,
    index: true,
  },

  errorCount: {
    type: Number,
    default: 0,
  },

  assignedTo: {
    type: String,   // userId or display name
    default: "Unassigned",
  },

  tags: [String],

  // AI-generated root cause + fix suggestion (populated by incidentQueue worker)
  aiSuggestion: {
    type: String,
    default: null,
  },

  lastOccurrence: {
    type: Date,
    default: Date.now,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for fast lookup of open incidents by fingerprint
incidentSchema.index({ fingerprint: 1, status: 1 });
// Sort index for dashboard queries
incidentSchema.index({ createdAt: -1 });

const IncidentModel = mongoose.model("Incident", incidentSchema);
export default IncidentModel;
