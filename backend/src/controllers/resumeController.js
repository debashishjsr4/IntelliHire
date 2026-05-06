import Candidate from "../models/Candidate.js";
import mongoose from "mongoose";
import { analyzeResumeText } from "../services/aiService.js";
import { extractTextFromPdf } from "../services/pdfService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const NOT_AVAILABLE = "Not available";
const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const lowercaseNameParticles = new Set([
  "da",
  "de",
  "del",
  "der",
  "di",
  "la",
  "le",
  "van",
  "von"
]);

const formatNameSegment = (segment) => {
  if (!segment) {
    return segment;
  }

  if (/^[A-Z]\.?$/i.test(segment)) {
    return segment.replace(".", "").toUpperCase();
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
};

const formatNameToken = (token, index) => {
  const normalizedToken = token.toLowerCase();

  if (index > 0 && lowercaseNameParticles.has(normalizedToken)) {
    return normalizedToken;
  }

  return token
    .split("-")
    .map((hyphenSegment) =>
      hyphenSegment
        .split("'")
        .map(formatNameSegment)
        .join("'")
    )
    .join("-");
};

const formatCandidateName = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedName = value.replace(/\s+/g, " ").trim();

  if (!normalizedName || normalizedName.toLowerCase() === "not available") {
    return "";
  }

  return normalizedName
    .split(" ")
    .map(formatNameToken)
    .join(" ");
};

const normalizeExtractedName = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const name = value.trim();

  if (!name || name.toLowerCase() === "not available") {
    return "";
  }

  return formatCandidateName(name);
};

const inferNameFromText = (resumeText) => {
  const skippedLinePatterns = [
    /^resume$/i,
    /^curriculum vitae$/i,
    /^cv$/i,
    /@/,
    /https?:\/\//i,
    /www\./i,
    /linkedin/i,
    /github/i,
    /\b\d{5,}\b/,
    /\b(phone|email|mobile|address|profile|summary|objective)\b/i
  ];

  return (
    resumeText
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .map((line) => line.split(/\s[|·•-]\s/)[0].trim())
      .filter(Boolean)
      .find((line) => {
        const words = line.split(" ").filter(Boolean);

        return (
          line.length >= 3 &&
          line.length <= 70 &&
          words.length >= 2 &&
          words.length <= 5 &&
          !skippedLinePatterns.some((pattern) => pattern.test(line)) &&
          !/\d/.test(line)
        );
      }) || ""
  );
};

const inferName = (resumeText, extractedName) =>
  normalizeExtractedName(extractedName) ||
  formatCandidateName(inferNameFromText(resumeText)) ||
  NOT_AVAILABLE;

const inferEmail = (resumeText, extractedEmail) => {
  const resumeEmail = resumeText.match(emailRegex)?.[0];

  if (resumeEmail) {
    return resumeEmail.toLowerCase();
  }

  if (typeof extractedEmail === "string" && emailRegex.test(extractedEmail)) {
    return extractedEmail.match(emailRegex)[0].toLowerCase();
  }

  return NOT_AVAILABLE;
};

const getSkillStrength = (skill, index) => {
  const characterTotal = skill
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return Math.min(96, 72 + ((characterTotal + index * 7) % 25));
};

const normalizeSkillScore = (score) => {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const getScoreLevel = (score) => {
  if (score >= 90) {
    return "Expert";
  }

  if (score >= 75) {
    return "Strong";
  }

  if (score >= 55) {
    return "Moderate";
  }

  if (score >= 30) {
    return "Mentioned";
  }

  return "Low evidence";
};

const normalizeScoreFactor = (score) => {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const normalizeScoreFactors = (scoreFactors) => {
  const source = scoreFactors && typeof scoreFactors === "object" ? scoreFactors : {};

  return {
    direct_application: normalizeScoreFactor(source.direct_application),
    complexity: normalizeScoreFactor(source.complexity),
    ownership: normalizeScoreFactor(source.ownership),
    impact: normalizeScoreFactor(source.impact),
    recency: normalizeScoreFactor(source.recency),
    evidence_quality: normalizeScoreFactor(source.evidence_quality)
  };
};

const buildSkillScores = (skillScores, skills) => {
  if (Array.isArray(skillScores) && skillScores.length) {
    return skillScores
      .filter((skill) => skill && typeof skill === "object" && typeof skill.name === "string")
      .slice(0, 10)
      .map((skill, index) => {
        const name = skill.name.trim();
        const score = normalizeSkillScore(skill.score) ?? getSkillStrength(name, index);

        return {
          name,
          score,
          level: getScoreLevel(score),
          score_factors: normalizeScoreFactors(skill.score_factors),
          evidence: typeof skill.evidence === "string" ? skill.evidence : ""
        };
      })
      .filter((skill) => skill.name);
  }

  return skills
    .filter((skill) => typeof skill === "string" && skill.trim())
    .slice(0, 10)
    .map((skill, index) => ({
      name: skill.trim(),
      score: getSkillStrength(skill.trim(), index),
      level: getScoreLevel(getSkillStrength(skill.trim(), index)),
      score_factors: {
        direct_application: getSkillStrength(skill.trim(), index),
        complexity: 0,
        ownership: 0,
        impact: 0,
        recency: 0,
        evidence_quality: 0
      },
      evidence: ""
    }));
};

const average = (values) => {
  const validValues = values.filter((value) => typeof value === "number" && !Number.isNaN(value));

  if (!validValues.length) {
    return 0;
  }

  return validValues.reduce((total, value) => total + value, 0) / validValues.length;
};

const capScore = (score, cap) => Math.min(score, cap);

const getProfileScoreLabel = (score) => {
  if (score >= 90) {
    return "Exceptional";
  }

  if (score >= 75) {
    return "Strong";
  }

  if (score >= 55) {
    return "Solid";
  }

  return "Emerging";
};

const normalizeProfileScoreFactors = (scoreFactors) => {
  const source = scoreFactors && typeof scoreFactors === "object" ? scoreFactors : {};

  return {
    professional_impact: normalizeScoreFactor(source.professional_impact),
    role_complexity: normalizeScoreFactor(source.role_complexity),
    ownership: normalizeScoreFactor(source.ownership),
    technical_depth: normalizeScoreFactor(source.technical_depth),
    career_progression: normalizeScoreFactor(source.career_progression),
    evidence_specificity: normalizeScoreFactor(source.evidence_specificity),
    recency: normalizeScoreFactor(source.recency)
  };
};

const normalizeStringList = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, 4)
    : [];

const buildFallbackProfileScore = ({ experienceTimeline, skillScores }) => {
  const scoredSkills = Array.isArray(skillScores) ? skillScores : [];
  const timeline = Array.isArray(experienceTimeline) ? experienceTimeline : [];
  const averageSkillScore = average(scoredSkills.map((skill) => skill.score || 0));
  const factors = {
    professional_impact: Math.round(
      average(scoredSkills.map((skill) => skill.score_factors?.impact || 0))
    ),
    role_complexity: Math.round(
      average(scoredSkills.map((skill) => skill.score_factors?.complexity || 0))
    ),
    ownership: Math.round(
      average(scoredSkills.map((skill) => skill.score_factors?.ownership || 0))
    ),
    technical_depth: Math.round(
      average([
        averageSkillScore,
        average(scoredSkills.map((skill) => skill.score_factors?.direct_application || 0)),
        average(scoredSkills.map((skill) => skill.score_factors?.complexity || 0))
      ])
    ),
    career_progression: Math.min(75, timeline.length * 15),
    evidence_specificity: Math.round(
      average(scoredSkills.map((skill) => skill.score_factors?.evidence_quality || 0))
    ),
    recency: Math.round(average(scoredSkills.map((skill) => skill.score_factors?.recency || 0)))
  };

  let score = Math.round(
    factors.professional_impact * 0.2 +
      factors.role_complexity * 0.16 +
      factors.ownership * 0.18 +
      factors.technical_depth * 0.18 +
      factors.career_progression * 0.08 +
      factors.evidence_specificity * 0.14 +
      factors.recency * 0.06
  );

  if (factors.professional_impact < 45) {
    score = capScore(score, 68);
  }

  if (factors.ownership < 45) {
    score = capScore(score, 72);
  }

  if (factors.evidence_specificity < 45) {
    score = capScore(score, 58);
  }

  const normalizedScore = Math.max(0, Math.min(100, score));

  return {
    version: 1,
    score: normalizedScore,
    label: getProfileScoreLabel(normalizedScore),
    score_factors: factors,
    rationale:
      "Profile score estimated from extracted skill evidence because the AI response did not include a dedicated profile score.",
    strengths: scoredSkills.slice(0, 2).map((skill) => `${skill.name}: ${skill.evidence || skill.level}`),
    caveats: ["No job description was provided, so this is not a role match score."]
  };
};

const normalizeProfileScore = (profileScore, fallbackContext) => {
  const source = profileScore && typeof profileScore === "object" ? profileScore : {};

  if (typeof source.score !== "number" || Number.isNaN(source.score)) {
    return buildFallbackProfileScore(fallbackContext);
  }

  const score = Math.max(0, Math.min(100, Math.round(source.score)));

  return {
    version: 1,
    score,
    label:
      typeof source.label === "string" &&
      ["Emerging", "Solid", "Strong", "Exceptional"].includes(source.label)
        ? source.label
        : getProfileScoreLabel(score),
    score_factors: normalizeProfileScoreFactors(source.score_factors),
    rationale: typeof source.rationale === "string" ? source.rationale : "",
    strengths: normalizeStringList(source.strengths),
    caveats: normalizeStringList(source.caveats)
  };
};

export const parseResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a PDF resume." });
  }

  // 1. Convert the uploaded PDF into text.
  const resumeText = await extractTextFromPdf(req.file.buffer);

  // 2. Send the extracted text to the configured LLM provider.
  const analysis = await analyzeResumeText(resumeText);
  const skillScores = buildSkillScores(analysis.skill_scores, analysis.skills);
  const candidateName = inferName(resumeText, analysis.candidate_name);
  const candidateEmail = inferEmail(resumeText, analysis.email);
  const profileScore = normalizeProfileScore(analysis.profile_score, {
    experienceTimeline: analysis.experience_timeline,
    skillScores
  });

  // 3. Store the result so recruiters can search candidates later.
  const candidate = await Candidate.create({
    name: candidateName,
    email: candidateEmail,
    extracted_skills: skillScores.map((skill) => skill.name),
    skill_scores: skillScores,
    profile_score: profileScore,
    resume_url: req.body.resume_url || req.file.originalname,
    summary: analysis.summary,
    experience_timeline: analysis.experience_timeline
  });

  res.status(201).json({
    candidate,
    skills: skillScores.map((skill) => skill.name),
    skill_scores: skillScores,
    profile_score: profileScore,
    summary: analysis.summary,
    experience_timeline: analysis.experience_timeline
  });
});

export const getParsedCandidates = asyncHandler(async (_req, res) => {
  const candidates = await Candidate.find({})
    .sort({ createdAt: -1 })
    .select("name email extracted_skills skill_scores profile_score resume_url summary experience_timeline createdAt updatedAt")
    .lean();

  res.status(200).json({ candidates });
});

export const deleteParsedCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;

  if (!mongoose.isValidObjectId(candidateId)) {
    return res.status(400).json({ message: "Invalid candidate id." });
  }

  const candidate = await Candidate.findByIdAndDelete(candidateId).lean();

  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found." });
  }

  res.status(200).json({
    candidateId,
    message: "Candidate deleted successfully."
  });
});
