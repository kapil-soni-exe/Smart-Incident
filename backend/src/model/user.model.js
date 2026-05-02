import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// User schema — stores platform accounts (not error/incident authors)
const userSchema = new mongoose.Schema(
  {
    // Display name shown in UI
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique email used for login
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Bcrypt-hashed password — never stored as plaintext
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // API key auto-generated at registration for SDK usage
    apiKey: {
      type: String,
      unique: true,
      index: true,
    },

    // Role-based access control (future use)
    role: {
      type: String,
      enum: ["admin", "developer", "viewer"],
      default: "developer",
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Hash password before saving — triggered on create and password change
userSchema.pre("save", async function () {
  // Only re-hash if the password field was actually modified
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12); // Cost factor 12
});

// Instance method: compare plain-text password against stored hash
userSchema.methods.comparePassword = async function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
