import mongoose from "mongoose";
import Candidate from "../models/Candidate.js";
import JobDescription from "../models/JobDescription.js";
import {
  analyzeCandidateJobMatch,
  analyzeJobDescriptionText
} from "../services/aiService.js";
import { extractTextFromJobDocument } from "../services/documentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const buildCandidateForMatching = (candidate) => ({
  name: candidate.name,
  email: candidate.email,
  summary: candidate.summary,
  profile_score: candidate.profile_score,
  skills: candidate.skill_scores,
  experience_timeline: candidate.experience_timeline
});

const buildJobForMatching = (jobDescription) => ({
  title: jobDescription.title,
  summary: jobDescription.summary,
  must_have_skills: jobDescription.must_have_skills,
  nice_to_have_skills: jobDescription.nice_to_have_skills,
  responsibilities: jobDescription.responsibilities,
  seniority_level: jobDescription.seniority_level,
  domain_context: jobDescription.domain_context,
  required_experience: jobDescription.required_experience,
  experience_requirements: jobDescription.experience_requirements,
  education_requirements: jobDescription.education_requirements,
  role_metadata: jobDescription.role_metadata,
  additional_sections: jobDescription.additional_sections,
  evaluation_criteria: jobDescription.evaluation_criteria
});

const normalizeText = (value) =>
  typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ") : "";

const getRequirementText = (jobDescription) =>
  [
    ...(jobDescription.must_have_skills || []),
    ...(jobDescription.nice_to_have_skills || []),
    ...(jobDescription.responsibilities || []),
    ...(jobDescription.experience_requirements || []),
    ...(jobDescription.education_requirements || []),
    ...((jobDescription.additional_sections || []).flatMap((section) => section.items || [])),
    ...(jobDescription.evaluation_criteria || [])
  ].join(" ");

const getCandidateSearchText = (candidate) =>
  normalizeText(
    [
      candidate.name,
      candidate.summary,
      ...(candidate.extracted_skills || []),
      ...(candidate.skill_scores || []).flatMap((skill) => [
        skill.name,
        skill.level,
        skill.evidence
      ]),
      ...(candidate.experience_timeline || []).flatMap((item) => [
        item.title,
        item.company,
        item.detail
      ])
    ]
      .filter(Boolean)
      .join(" ")
  );

const getRequirementTokens = (requirement) =>
  normalizeText(requirement)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

const requirementMatchesCandidate = (requirement, candidateText) => {
  const normalizedRequirement = normalizeText(requirement).trim();

  if (!normalizedRequirement) {
    return false;
  }

  if (candidateText.includes(normalizedRequirement)) {
    return true;
  }

  const tokens = getRequirementTokens(requirement);

  if (!tokens.length) {
    return false;
  }

  const matchedTokens = tokens.filter((token) => candidateText.includes(token));

  return matchedTokens.length / tokens.length >= 0.5;
};

const calculateShortlistScore = ({ candidate, jobDescription }) => {
  const candidateText = getCandidateSearchText(candidate);
  const mustHave = jobDescription.must_have_skills || [];
  const niceToHave = jobDescription.nice_to_have_skills || [];
  const evaluationCriteria = jobDescription.evaluation_criteria || [];
  const experienceRequirements = jobDescription.experience_requirements || [];
  const educationRequirements = jobDescription.education_requirements || [];
  const matchedMustHave = mustHave.filter((requirement) =>
    requirementMatchesCandidate(requirement, candidateText)
  );
  const matchedNiceToHave = niceToHave.filter((requirement) =>
    requirementMatchesCandidate(requirement, candidateText)
  );
  const matchedCriteria = evaluationCriteria.filter((requirement) =>
    requirementMatchesCandidate(requirement, candidateText)
  );
  const matchedExperience = experienceRequirements.filter((requirement) =>
    requirementMatchesCandidate(requirement, candidateText)
  );
  const matchedEducation = educationRequirements.filter((requirement) =>
    requirementMatchesCandidate(requirement, candidateText)
  );
  const mustHaveScore = mustHave.length ? (matchedMustHave.length / mustHave.length) * 45 : 20;
  const experienceScore = experienceRequirements.length
    ? (matchedExperience.length / experienceRequirements.length) * 15
    : 5;
  const educationScore = educationRequirements.length
    ? (matchedEducation.length / educationRequirements.length) * 5
    : 3;
  const niceToHaveScore = niceToHave.length ? (matchedNiceToHave.length / niceToHave.length) * 10 : 5;
  const criteriaScore = evaluationCriteria.length
    ? (matchedCriteria.length / evaluationCriteria.length) * 10
    : 5;
  const profileContribution = Math.min(10, ((candidate.profile_score?.score || 0) / 100) * 10);
  const evidenceContribution = Math.min(
    10,
    ((candidate.skill_scores || []).filter((skill) => skill.evidence).length / 6) * 10
  );
  const shortlistScore = Math.round(
    mustHaveScore + niceToHaveScore + criteriaScore + profileContribution + evidenceContribution
  );

  return {
    already_matched: (candidate.job_matches || []).some(
      (match) => match.job_description_id?.toString() === jobDescription._id.toString()
    ),
    candidate,
    matched_requirements: [
      ...matchedMustHave,
      ...matchedExperience,
      ...matchedEducation,
      ...matchedNiceToHave,
      ...matchedCriteria
    ].slice(0, 8),
    missing_requirements: mustHave
      .filter((requirement) => !matchedMustHave.includes(requirement))
      .concat(experienceRequirements.filter((requirement) => !matchedExperience.includes(requirement)))
      .slice(0, 8),
    requirement_signal: `${matchedMustHave.length}/${mustHave.length || 0} must-have`,
    shortlist_score: Math.max(0, Math.min(100, shortlistScore))
  };
};

export const buildStoredJobMatch = ({ jobDescription, match }) => ({
  job_description_id: jobDescription._id,
  job_title: jobDescription.title,
  score: match.score,
  label: match.label,
  rationale: match.rationale,
  matched_requirements: match.matched_requirements,
  missing_requirements: match.missing_requirements,
  concerns: match.concerns,
  interview_focus: match.interview_focus,
  createdAt: new Date()
});

export const upsertCandidateJobMatch = (candidate, storedMatch) => {
  const jobId = storedMatch.job_description_id.toString();
  const existingMatches = Array.isArray(candidate.job_matches) ? candidate.job_matches : [];

  candidate.job_matches = [
    storedMatch,
    ...existingMatches.filter((match) => match.job_description_id?.toString() !== jobId)
  ];
};

export const createJobMatchForCandidate = async ({ candidate, jobDescription }) => {
  const match = await analyzeCandidateJobMatch({
    candidate: buildCandidateForMatching(candidate),
    jobDescription: buildJobForMatching(jobDescription)
  });

  return buildStoredJobMatch({ jobDescription, match });
};

export const uploadJobDescription = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a PDF or DOCX job description." });
  }

  const jobText = await extractTextFromJobDocument(req.file);
  const analysis = await analyzeJobDescriptionText(jobText);
  const jobDescription = await JobDescription.create({
    ...analysis,
    source_file: req.file.originalname
  });

  res.status(201).json({ jobDescription });
});

export const createJobDescriptionFromText = asyncHandler(async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const sourceName =
    typeof req.body?.sourceName === "string" && req.body.sourceName.trim()
      ? req.body.sourceName.trim()
      : "Pasted job description";

  if (text.length < 20) {
    return res.status(400).json({ message: "Paste at least 20 characters of job description text." });
  }

  const analysis = await analyzeJobDescriptionText(text);
  const jobDescription = await JobDescription.create({
    ...analysis,
    source_file: sourceName
  });

  res.status(201).json({ jobDescription });
});

export const getJobDescriptions = asyncHandler(async (_req, res) => {
  const jobDescriptions = await JobDescription.find({}).sort({ createdAt: -1 }).lean();

  res.status(200).json({ jobDescriptions });
});

export const getJobDescription = asyncHandler(async (req, res) => {
  const { jobDescriptionId } = req.params;

  if (!mongoose.isValidObjectId(jobDescriptionId)) {
    return res.status(400).json({ message: "Invalid job description id." });
  }

  const jobDescription = await JobDescription.findById(jobDescriptionId).lean();

  if (!jobDescription) {
    return res.status(404).json({ message: "Job description not found." });
  }

  res.status(200).json({ jobDescription });
});

export const updateJobDescription = asyncHandler(async (req, res) => {
  const { jobDescriptionId } = req.params;
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";

  if (!mongoose.isValidObjectId(jobDescriptionId)) {
    return res.status(400).json({ message: "Invalid job description id." });
  }

  if (!title) {
    return res.status(400).json({ message: "Job description name is required." });
  }

  if (title.length > 140) {
    return res.status(400).json({ message: "Job description name must be 140 characters or fewer." });
  }

  const jobDescription = await JobDescription.findByIdAndUpdate(
    jobDescriptionId,
    { title },
    { new: true, runValidators: true }
  ).lean();

  if (!jobDescription) {
    return res.status(404).json({ message: "Job description not found." });
  }

  await Candidate.updateMany(
    { "job_matches.job_description_id": jobDescription._id },
    { $set: { "job_matches.$[match].job_title": title } },
    { arrayFilters: [{ "match.job_description_id": jobDescription._id }] }
  );

  res.status(200).json({ jobDescription });
});

export const deleteJobDescription = asyncHandler(async (req, res) => {
  const { jobDescriptionId } = req.params;

  if (!mongoose.isValidObjectId(jobDescriptionId)) {
    return res.status(400).json({ message: "Invalid job description id." });
  }

  const jobDescription = await JobDescription.findByIdAndDelete(jobDescriptionId).lean();

  if (!jobDescription) {
    return res.status(404).json({ message: "Job description not found." });
  }

  await Candidate.updateMany(
    { "job_matches.job_description_id": jobDescription._id },
    { $pull: { job_matches: { job_description_id: jobDescription._id } } }
  );

  res.status(200).json({
    jobDescriptionId,
    message: "Job description deleted successfully."
  });
});

export const getCandidateShortlist = asyncHandler(async (req, res) => {
  const { jobDescriptionId } = req.params;
  const limit = Math.max(5, Math.min(50, Number.parseInt(req.query.limit || "10", 10) || 10));

  if (!mongoose.isValidObjectId(jobDescriptionId)) {
    return res.status(400).json({ message: "Invalid job description id." });
  }

  const jobDescription = await JobDescription.findById(jobDescriptionId).lean();

  if (!jobDescription) {
    return res.status(404).json({ message: "Job description not found." });
  }

  const requirementText = getRequirementText(jobDescription);

  if (!requirementText.trim()) {
    return res.status(400).json({
      message: "This job description does not contain enough normalized requirements to shortlist candidates."
    });
  }

  const candidates = await Candidate.find({}).sort({ createdAt: -1 }).lean();
  const shortlist = candidates
    .map((candidate) => calculateShortlistScore({ candidate, jobDescription }))
    .filter((item) => item.shortlist_score > 0)
    .sort((a, b) => b.shortlist_score - a.shortlist_score)
    .slice(0, limit);

  res.status(200).json({ shortlist });
});

export const matchSelectedCandidates = asyncHandler(async (req, res) => {
  const { jobDescriptionId } = req.params;
  const candidateIds = Array.isArray(req.body?.candidate_ids) ? req.body.candidate_ids : [];

  if (!mongoose.isValidObjectId(jobDescriptionId)) {
    return res.status(400).json({ message: "Invalid job description id." });
  }

  if (!candidateIds.length) {
    return res.status(400).json({ message: "Select at least one candidate to match." });
  }

  if (candidateIds.length > 25) {
    return res.status(400).json({ message: "Please match 25 or fewer candidates at a time." });
  }

  const invalidCandidateId = candidateIds.find((candidateId) => !mongoose.isValidObjectId(candidateId));

  if (invalidCandidateId) {
    return res.status(400).json({ message: "One or more candidate IDs are invalid." });
  }

  const jobDescription = await JobDescription.findById(jobDescriptionId);

  if (!jobDescription) {
    return res.status(404).json({ message: "Job description not found." });
  }

  const candidates = await Candidate.find({ _id: { $in: candidateIds } });
  const updatedCandidates = [];

  for (const candidate of candidates) {
    const storedMatch = await createJobMatchForCandidate({ candidate, jobDescription });
    upsertCandidateJobMatch(candidate, storedMatch);
    await candidate.save();
    updatedCandidates.push(candidate.toObject());
  }

  res.status(200).json({
    candidates: updatedCandidates,
    matchedCount: updatedCandidates.length
  });
});

export const matchExistingCandidates = asyncHandler(async (req, res) => {
  const { jobDescriptionId } = req.params;

  if (!mongoose.isValidObjectId(jobDescriptionId)) {
    return res.status(400).json({ message: "Invalid job description id." });
  }

  const jobDescription = await JobDescription.findById(jobDescriptionId);

  if (!jobDescription) {
    return res.status(404).json({ message: "Job description not found." });
  }

  const candidates = await Candidate.find({}).sort({ createdAt: -1 });
  const updatedCandidates = [];

  for (const candidate of candidates) {
    const storedMatch = await createJobMatchForCandidate({ candidate, jobDescription });
    upsertCandidateJobMatch(candidate, storedMatch);
    await candidate.save();
    updatedCandidates.push(candidate.toObject());
  }

  res.status(200).json({
    candidates: updatedCandidates,
    matchedCount: updatedCandidates.length
  });
});
