import { Router } from "express";
import multer from "multer";
import {
  deleteParsedCandidate,
  getParsedCandidates,
  parseResume
} from "../controllers/resumeController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      return callback(new Error("Only PDF resumes are supported."));
    }

    callback(null, true);
  }
});

router.get("/candidates", getParsedCandidates);
router.delete("/candidates/:candidateId", deleteParsedCandidate);
router.post("/parse", upload.single("resume"), parseResume);

export default router;
