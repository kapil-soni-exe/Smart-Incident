import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: String,

  service: {
    type: String,
    required: true
  },

  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium"
  },

  status: {
    type: String,
    enum: ["open", "investigating", "resolved", "closed"],
    default: "open"
  },

  fingerprint: {
    type: String,
    required: true,
    index: true
  },

  errorCount: {
    type: Number,
    default: 0
  },

  assignedTo: {
    type: String, // userId or name
    default: "Unassigned"
  },

  tags: [String],

  lastOccurrence: {
    type: Date,
    default: Date.now
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast lookup of open incidents by fingerprint
incidentSchema.index({ fingerprint: 1, status: 1 });

const IncidentModel = mongoose.model("Incident", incidentSchema);
export default IncidentModel;
