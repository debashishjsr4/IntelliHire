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
          score_factors: {
            direct_application: {
              type: Number,
              min: 0,
              max: 100,
              default: 0
            },
            complexity: {
              type: Number,
              min: 0,
              max: 100,
              default: 0
            },
            ownership: {
              type: Number,
              min: 0,
              max: 100,
              default: 0
            },
            impact: {
              type: Number,
              min: 0,
              max: 100,
              default: 0
            },
            recency: {
              type: Number,
              min: 0,
              max: 100,
              default: 0
            },
            evidence_quality: {
              type: Number,
              min: 0,
              max: 100,
              default: 0
            }
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
    profile_confidence: {
      version: {
        type: Number,
        default: 2
      },
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      label: {
        type: String,
        trim: true,
        default: "Limited Profile"
      },
      signals: {
        type: [String],
        default: []
      }
    },
    profile_score: {
      version: {
        type: Number,
        default: 1
      },
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      label: {
        type: String,
        trim: true,
        default: "Emerging"
      },
      score_factors: {
        professional_impact: {
          type: Number,
          min: 0,
          max: 100,
          default: 0
        },
        role_complexity: {
          type: Number,
          min: 0,
          max: 100,
          default: 0
        },
        ownership: {
          type: Number,
          min: 0,
          max: 100,
          default: 0
        },
        technical_depth: {
          type: Number,
          min: 0,
          max: 100,
          default: 0
        },
        career_progression: {
          type: Number,
          min: 0,
          max: 100,
          default: 0
        },
        evidence_specificity: {
          type: Number,
          min: 0,
          max: 100,
          default: 0
        },
        recency: {
          type: Number,
          min: 0,
          max: 100,
          default: 0
        }
      },
      rationale: {
        type: String,
        trim: true,
        default: ""
      },
      strengths: {
        type: [String],
        default: []
      },
      caveats: {
        type: [String],
        default: []
      }
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
