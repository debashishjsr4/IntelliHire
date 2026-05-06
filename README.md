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

If Gemini or OpenAI quota is exhausted but you still want uploads to complete during demos, keep your main provider and add:

```env
LLM_FALLBACK_PROVIDER=mock
```

The mock fallback is illustrative and should not be used for real candidate evaluation.

Core endpoint:

```http
POST /api/resumes/parse
Content-Type: multipart/form-data

resume=<pdf-file>
resume_url=<optional hosted resume URL>
```

Candidate name and email are extracted from the uploaded CV. If no email address is found, the saved candidate record uses `Not available`.
Skill percentages are scored conservatively by the configured LLM from explicit resume evidence and stored with the candidate as `skill_scores`, including the skill name, score, derived level, score factors, and evidence. The extracted skill profile keeps up to 10 skills, including strengths as well as weakly supported CV mentions, so recruiters can distinguish real strengths from low-evidence keywords. The UI groups skills into strengths, moderate evidence, and low-evidence mentions. The scoring prompt weighs direct application, complexity, ownership, impact, recency, and evidence quality, then applies caps for shallow or vague CV evidence.
Each successfully parsed CV also stores `profile_score`, a 0-100 signal for how strong the candidate appears from the CV claims in their own area of experience. It is not a job-match score unless a job description is provided. The score weighs professional impact, role complexity, ownership, technical depth, career progression, evidence specificity, and recency. Scores above 90 should be rare and reserved for exceptional achievements or repeated high-impact delivery.

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
- `LLM_FALLBACK_PROVIDER=mock` optional demo fallback when provider quota is exhausted.
- `LLM_TIMEOUT_MS=50000`
- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash`
- `CLIENT_ORIGIN=https://your-vercel-app.vercel.app`
- `VITE_API_BASE_URL=https://your-vercel-app.vercel.app` optionally, because production defaults to same-origin API calls.
