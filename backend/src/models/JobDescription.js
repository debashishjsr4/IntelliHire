import mongoose from "mongoose";

const jobRequirementSchema = {
  type: [String],
  default: []
};

const labelValueSchema = {
  label: {
    type: String,
    trim: true,
    default: ""
  },
  value: {
    type: String,
    trim: true,
    default: ""
  }
};

const flexibleSectionSchema = {
  title: {
    type: String,
    trim: true,
    default: ""
  },
  items: jobRequirementSchema
};

const jobDescriptionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "Untitled role"
    },
    source_file: {
      type: String,
      trim: true,
      default: ""
    },
    summary: {
      type: String,
      trim: true,
      default: ""
    },
    must_have_skills: jobRequirementSchema,
    nice_to_have_skills: jobRequirementSchema,
    responsibilities: jobRequirementSchema,
    seniority_level: {
      type: String,
      trim: true,
      default: "Not specified"
    },
    domain_context: {
      type: String,
      trim: true,
      default: "Not specified"
    },
    required_experience: {
      type: String,
      trim: true,
      default: "Not specified"
    },
    experience_requirements: jobRequirementSchema,
    education_requirements: jobRequirementSchema,
    role_metadata: {
      type: [labelValueSchema],
      default: []
    },
    source_notes: jobRequirementSchema,
    additional_sections: {
      type: [flexibleSectionSchema],
      default: []
    },
    evaluation_criteria: jobRequirementSchema
  },
  {
    timestamps: true
  }
);

const JobDescription = mongoose.model("JobDescription", jobDescriptionSchema);

export default JobDescription;
