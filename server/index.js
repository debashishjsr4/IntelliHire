import app from "../backend/src/app.js";
import connectDB from "../backend/src/config/db.js";

let cachedConnectionPromise;

const ensureDatabaseConnection = () => {
  if (!cachedConnectionPromise) {
    cachedConnectionPromise = connectDB();
  }

  return cachedConnectionPromise;
};

export default async function handler(req, res) {
  await ensureDatabaseConnection();

  // Express apps are request handlers, so Vercel can invoke the same app without app.listen().
  return app(req, res);
}

