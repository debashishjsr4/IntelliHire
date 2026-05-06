import Candidate from "../models/Candidate.js";
import { analyzeResumeText } from "../services/aiService.js";
import { extractTextFromPdf } from "../services/pdfService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

const inferEmail = (resumeText, fallbackEmail) => {
  if (fallbackEmail) {
    return fallbackEmail;
  }

  return resumeText.match(emailRegex)?.[0] || "";
};

export const parseResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a PDF resume." });
  }

  // 1. Convert the uploaded PDF into text.
  const resumeText = await extractTextFromPdf(req.file.buffer);

  // 2. Send the extracted text to the configured LLM provider.
  const analysis = await analyzeResumeText(resumeText);

  // 3. Store the result so recruiters can search candidates later.
  const candidate = await Candidate.create({
    name: req.body.name,
    email: inferEmail(resumeText, req.body.email),
    extracted_skills: analysis.skills,
    resume_url: req.body.resume_url || req.file.originalname,
    summary: analysis.summary,
    experience_timeline: analysis.experience_timeline
  });

  res.status(201).json({
    candidate,
    skills: analysis.skills,
    summary: analysis.summary,
    experience_timeline: analysis.experience_timeline
  });
});

export const getParsedCandidates = asyncHandler(async (_req, res) => {
  const candidates = await Candidate.find({})
    .sort({ createdAt: -1 })
    .select("name email extracted_skills resume_url summary experience_timeline createdAt updatedAt")
    .lean();

  res.status(200).json({ candidates });
});
