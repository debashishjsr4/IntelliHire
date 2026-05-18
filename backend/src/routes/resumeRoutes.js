import { Router } from "express";
import multer from "multer";
import {
  deleteCandidateJobMatch,
  deleteParsedCandidate,
  getParsedCandidates,
  parseResume
} from "../controllers/resumeController.js";
import { isSupportedJobDocument } from "../services/documentService.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!isSupportedJobDocument(file)) {
      return callback(new Error("Only PDF and DOCX resumes are supported."));
    }

    callback(null, true);
  }
});

router.get("/candidates", getParsedCandidates);
router.delete("/candidates/:candidateId/job-matches/:jobDescriptionId", deleteCandidateJobMatch);
router.delete("/candidates/:candidateId", deleteParsedCandidate);
router.post("/parse", upload.single("resume"), parseResume);

export default router;
