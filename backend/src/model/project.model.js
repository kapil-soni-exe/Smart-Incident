import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    apiKey: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["web", "node", "python", "other"],
      default: "web",
    },
    // Custom threshold for incident promotion
    alertThreshold: {
      type: Number,
      default: 10,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

const ProjectModel = mongoose.model("Project", projectSchema);
export default ProjectModel;
