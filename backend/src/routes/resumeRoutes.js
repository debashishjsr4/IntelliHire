import { Router } from "express";
import multer from "multer";
import { parseResume } from "../controllers/resumeController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      return callback(new Error("Only PDF resumes are supported."));
    }

    callback(null, true);
  }
});

router.post("/parse", upload.single("resume"), parseResume);

export default router;

