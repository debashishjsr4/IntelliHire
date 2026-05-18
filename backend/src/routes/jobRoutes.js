import { Router } from "express";
import multer from "multer";
import {
  createJobDescriptionFromText,
  deleteJobDescription,
  getCandidateShortlist,
  getJobDescription,
  getJobDescriptions,
  matchExistingCandidates,
  matchSelectedCandidates,
  updateJobDescription,
  uploadJobDescription
} from "../controllers/jobController.js";
import { isSupportedJobDocument } from "../services/documentService.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!isSupportedJobDocument(file)) {
      return callback(new Error("Only PDF and DOCX job descriptions are supported."));
    }

    callback(null, true);
  }
});

router.get("/", getJobDescriptions);
router.get("/:jobDescriptionId/shortlist", getCandidateShortlist);
router.get("/:jobDescriptionId", getJobDescription);
router.patch("/:jobDescriptionId", updateJobDescription);
router.delete("/:jobDescriptionId", deleteJobDescription);
router.post("/upload", upload.single("jobDescription"), uploadJobDescription);
router.post("/text", createJobDescriptionFromText);
router.post("/:jobDescriptionId/match-selected", matchSelectedCandidates);
router.post("/:jobDescriptionId/match-candidates", matchExistingCandidates);

export default router;
