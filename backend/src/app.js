import "dotenv/config";
import cors from "cors";
import express from "express";
import resumeRoutes from "./routes/resumeRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  vercelOrigin,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "intellihire-api" });
});

app.use("/api/resumes", resumeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
