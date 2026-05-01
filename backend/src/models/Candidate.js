import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "Unknown Candidate"
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: ""
    },
    extracted_skills: {
      type: [String],
      default: []
    },
    resume_url: {
      type: String,
      trim: true,
      default: ""
    },
    summary: {
      type: String,
      trim: true,
      default: ""
    },
    experience_timeline: {
      type: [
        {
          title: {
            type: String,
            trim: true,
            default: "Milestone"
          },
          company: {
            type: String,
            trim: true,
            default: "Not specified"
          },
          period: {
            type: String,
            trim: true,
            default: "Not specified"
          },
          detail: {
            type: String,
            trim: true,
            default: ""
          }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
