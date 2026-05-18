import mammoth from "mammoth";
import { extractTextFromPdf } from "./pdfService.js";

const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const isSupportedJobDocument = (file) => {
  if (!file) {
    return false;
  }

  const fileName = file.originalname || "";

  return (
    file.mimetype === "application/pdf" ||
    file.mimetype === DOCX_MIME_TYPE ||
    fileName.toLowerCase().endsWith(".docx")
  );
};

export const extractTextFromDocx = async (buffer) => {
  if (!buffer) {
    throw new Error("Word document buffer is required.");
  }

  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim();

  if (!text) {
    throw new Error("No readable text was found in the uploaded Word document.");
  }

  return text;
};

export const extractTextFromJobDocument = async (file) => {
  if (!file?.buffer) {
    throw new Error("Job description file is required.");
  }

  if (file.mimetype === "application/pdf") {
    return extractTextFromPdf(file.buffer);
  }

  if (
    file.mimetype === DOCX_MIME_TYPE ||
    (file.originalname || "").toLowerCase().endsWith(".docx")
  ) {
    return extractTextFromDocx(file.buffer);
  }

  throw new Error("Only PDF and DOCX job descriptions are supported.");
};
