# IntelliHire

AI-driven recruitment marketplace starter using the MERN stack.

## Project Layout

- `backend/` - Express, MongoDB, Mongoose, PDF parsing, and LLM integration.
- `frontend/` - React + Vite + Tailwind upload UI.

## Backend

Start local MongoDB with Docker Desktop:

```bash
docker compose up -d
```

MongoDB will run on `localhost:27017`. Mongo Express will be available at `http://localhost:8081`.

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

For classroom demos without paid AI quota, set this in `backend/.env`:

```env
LLM_PROVIDER=mock
```

Core endpoint:

```http
POST /api/resumes/parse
Content-Type: multipart/form-data

resume=<pdf-file>
resume_url=<optional hosted resume URL>
```

Candidate name and email are extracted from the uploaded CV. If no email address is found, the saved candidate record uses `Not available`.
Skill percentages are scored by the configured LLM from resume evidence and stored with the candidate as `skill_scores`, including the skill name, score, derived level, and evidence. The level is derived from the score bands shown in the UI guide so labels stay consistent.

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to your backend URL in Vercel.

## Vercel Deployment

This repository includes a root `vercel.json` and a serverless Express adapter at `server/index.js`.

Set these environment variables in Vercel:

- `MONGODB_URI`
- `LLM_PROVIDER=gemini`
- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash`
- `CLIENT_ORIGIN=https://your-vercel-app.vercel.app`
- `VITE_API_BASE_URL=https://your-vercel-app.vercel.app` optionally, because production defaults to same-origin API calls.
