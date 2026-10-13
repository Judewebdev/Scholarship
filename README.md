# Scholarship Agent MVP

A real Next.js starter for researching, matching, and tracking global master's scholarship opportunities for a single applicant. It includes a responsive dashboard, applicant profile form, live AI research endpoint using OpenAI Responses API web search, MongoDB persistence, and application status tracking.

## Current capabilities

- Applicant profile editor tailored to a BA in Theatre and Media Arts, but configurable for other degrees.
- Live scholarship discovery via OpenAI Responses API with web search enabled.
- Structured result validation before showing opportunity records.
- MongoDB persistence for applicant profile and opportunities.
- Official source and application links, funding coverage, deadline, language, fee and verification notes fields.
- Application pipeline statuses: discovered, needs review, preparing, ready for approval, submitted, not pursuing, result received.
- Mobile-responsive dashboard.

## Important scope boundary

This is an MVP foundation, not a deployed or fully autonomous application bot. It does **not** log into university portals or submit applications. Portal automation should be added only for tested portals and only where their terms permit it. Keep human review before any application is submitted. Never automate false declarations, invent applicant achievements, bypass CAPTCHA, or store passwords in the profile.

The UI currently stores only one primary applicant profile. A temporary HTTP Basic Auth gate is included for production using APP_ACCESS_USER and APP_ACCESS_PASSWORD. Set a strong password before deployment. Before storing real personal data on a public deployment, replace this with full authentication/authorisation, audit logging, encrypted file storage, data retention/deletion controls, rate limiting, and appropriate privacy notices. Avoid passport numbers, bank details, and other highly sensitive information in this initial version.

## Requirements

- Node.js 20.9+ recommended
- MongoDB Atlas or another MongoDB deployment
- OpenAI API key with Responses API and web search access
- Vercel account for hosting (optional for local development)

## Run locally

1. Extract the project.
2. Copy `.env.example` to `.env.local`.
3. Set `OPENAI_API_KEY`, `OPENAI_MODEL`, `MONGODB_URI`, and optionally `MONGODB_DB`.
4. Install and run:

```bash
npm install
npm run dev
```

5. Open `http://localhost:3000`.

If MongoDB is not configured, the UI still loads, but saving the profile and persisted opportunity tracking will not work. Live research requires an API key.

## Deploy to Vercel

1. Push this folder to a private GitHub repository.
2. Import the repository into Vercel.
3. Add the environment variables from `.env.example` in Vercel Project Settings, including a strong `APP_ACCESS_PASSWORD` and `APP_ACCESS_USER` for the temporary production gate.
4. Deploy and test profile saving, research, and opportunity status updates.
5. Add authentication before sharing the deployment or entering real applicant data.

## API routes

- `GET /api/profile` — load primary profile
- `POST /api/profile` — save primary profile
- `GET /api/opportunities` — list tracked opportunities
- `POST /api/opportunities` — upsert opportunity records
- `PATCH /api/opportunities` — update an opportunity status
- `POST /api/research` — live AI-assisted scholarship research and optional persistence

## Data model

Opportunity records retain the official provider URL, application URL, funding coverage, eligibility summary, match score, deadline, application fee, language requirements, required documents, next action, source-check date, and verification notes. These notes are essential: search output is a lead, not proof of eligibility or an open application call.

## Next development milestones

1. Add secure authentication and applicant-specific access control.
2. Add a document vault with signed URLs and retention/deletion controls.
3. Add official-source crawling/normalisation, deduplication, and recurring deadline checks.
4. Add evidence citations/source snapshots per scholarship and a confidence score.
5. Add a human review queue for essays and forms.
6. Implement a small set of portal-specific application helpers, with portal terms checks and explicit user confirmation before final submission.
7. Add email notifications and a detailed audit trail.
8. Add integration tests and deploy to a protected environment.
