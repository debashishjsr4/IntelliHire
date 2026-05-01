import pdf from "pdf-parse/lib/pdf-parse.js";

export const extractTextFromPdf = async (buffer) => {
  if (!buffer) {
    throw new Error("PDF buffer is required.");
  }

  // pdf-parse reads the uploaded PDF buffer and returns the plain text content.
  const parsedPdf = await pdf(buffer);
  const text = parsedPdf.text?.trim();

  if (!text) {
    throw new Error("No readable text was found in the uploaded PDF.");
  }

  return text;
};

