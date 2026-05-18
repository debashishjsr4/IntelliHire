import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      trim: true,
      unique: true,
      required: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    salt: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "recruiter"],
      default: "recruiter"
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: String,
      trim: true,
      default: "SmartAdmin"
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;
