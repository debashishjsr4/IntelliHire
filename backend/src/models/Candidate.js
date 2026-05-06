import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "Not available"
    },
    email: {
      type: String,
      trim: true,
      index: true,
      default: "Not available"
    },
    extracted_skills: {
      type: [String],
      default: []
    },
    skill_scores: {
      type: [
        {
          name: {
            type: String,
            trim: true,
            default: ""
          },
          score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
          },
          level: {
            type: String,
            trim: true,
            default: ""
          },
          evidence: {
            type: String,
            trim: true,
            default: ""
          }
        }
      ],
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
