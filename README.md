# MoodQuest

**AI-Powered Mental Wellness & Gamification Platform** — final-year capstone project.

MoodQuest is a full-stack web app where users check in their mood, talk to a supportive companion, play calming mini-games, follow guided breathing/yoga/mindfulness exercises, keep a private journal, get mood-aware music and movie suggestions, and track their progress over time. A manually accessible emergency page puts helplines and trusted contacts one tap away.

Architecture:

```
React + TypeScript  →  Node.js + Express + TypeScript  →  Prisma ORM  →  PostgreSQL
```

Every screen talks to the real API and every piece of user data is stored in PostgreSQL. The chat companion uses a real LLM through Groq. Facial-expression recognition is integrated through the separate YOLO11n Python service; see [INTEGRATION-YOLO11N.md](INTEGRATION-YOLO11N.md).

---

## Contents

1. [Screenshots](#screenshots)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech stack](#tech-stack)
5. [Folder structure](#folder-structure)
6. [Database schema](#database-schema)
7. [Environment variables](#environment-variables)
8. [Setup](#setup)
9. [API reference](#api-reference)
10. [Testing](#testing)
11. [Future work](#future-work)
12. [Known limitations](#known-limitations)

---

## Screenshots

| Welcome | Dashboard | AI Chat | Progress |
|---|---|---|---|
| ![Welcome](docs/screenshots/01-welcome.png) | ![Dashboard](docs/screenshots/03-dashboard-calm.png) | ![Chat](docs/screenshots/04-chat.png) | ![Progress](docs/screenshots/11-progress-mood.png) |

| Music | Mini Games | Meditation | Emergency |
|---|---|---|---|
| ![Music](docs/screenshots/05-music.png) | ![Games](docs/screenshots/07-games.png) | ![Meditation](docs/screenshots/09-meditation.png) | ![Emergency](docs/screenshots/13-emergency.png) |

---

## Features

| Screen | What works |
|---|---|
| **Welcome / Auth** | Email + password registration and login (bcrypt + JWT), logout with server-side token revocation, session restore after refresh, protected routes, expired-session handling, rate-limited login. Email is the only sign-in method. |
| **Dashboard** | Time-of-day greeting with the signed-in user's name, six-mood check-in saved to PostgreSQL, current mood card and activity streak computed from real data, "Chat with AI" card with voice input and spoken replies, quick-access grid, notification bell with reminders derived from your check-ins. Emotion Detection is one tap away from the top of the page: a face-scan icon in the header and a "Detect with camera" button next to the mood question. |
| **AI Chat** | Conversations and messages persisted in PostgreSQL; replies are generated **by the backend** with a real LLM through Groq (or built-in keyword replies when no key is configured). History, new/delete conversation, suggested prompts (some open the matching feature), empty-message validation. |
| **Emotion Detection** | Reachable from the Home header, the mood question and directly under Home in the desktop sidebar. Live camera preview via the browser MediaDevices API (start/stop, camera picker, permission errors). When enabled, the page sends still frames to the authenticated MoodQuest API about every 1.5 seconds; the Node backend proxies them to the YOLO11n service. Periodic, confidence-filtered camera mood observations are stored with `source = camera`. |
| **Progress & Analytics** | Mood trend, mood distribution, insights (improvement vs previous period / dominant mood), activity breakdown, recent games and exercises, journal stats, streak calendar; 7/30/90-day ranges; empty states instead of fake history. |
| **Music / Movies** | Mood-aware recommendations from the database ("For You" uses your latest check-in), category tabs, search, featured card; links open YouTube. |
| **Mini Games** | Six playable games — Breathing Flow, Color Match, Memory Challenge, Zen Garden, Stress Burst, Puzzle Mind. Every finished session is stored (`score`, `duration`, `completed_at`). |
| **Meditation & Exercises** | Activities with guided, timed steps; completion is persisted and counts towards streaks and mindful minutes. |
| **Emergency** | Public page (works logged out or offline): SOS with confirmation and `tel:` dialling, trusted contacts stored per user, "Find nearby help" via maps, configurable helpline. No automated detection. |
| **Journal** | Full create / read / update / delete with optional mood tag. |
| **Profile & Settings** | Name, avatar URL, language, timezone (used for streaks/charts), notification preferences, change password, trusted contacts, logout. |


## 🤖 YOLO11n-Based Facial Emotion Recognition

MoodQuest integrates a custom-trained **YOLO11n (You Only Look Once – Nano)** model for real-time facial expression recognition.

The model is deployed through a separate Python FastAPI microservice and communicates with the MoodQuest Node.js backend.

### Model Details

| Component | Details |
|---|---|
| Detection Model | YOLO11n |
| Model File | `best.pt` |
| Model Format | PyTorch |
| Inference Service | Python + FastAPI |
| Dataset Size | Approximately 70,000 images |
| Detection Type | Facial Expression Recognition |

### Facial Expressions Detected

The model is trained to recognize the following **9 facial expression classes**:

| Class ID | Expression |
|---|---|
| 0 | Angry |
| 1 | Contempt |
| 2 | Disgust |
| 3 | Fear |
| 4 | Happy |
| 5 | Natural |
| 6 | Sad |
| 7 | Sleepy |
| 8 | Surprised |

### Mood Mapping in MoodQuest

The detected facial expressions are mapped to MoodQuest's mood categories:

| Detected Expression | MoodQuest Mood |
|---|---|
| Happy | Happy |
| Natural | Calm |
| Sleepy | Calm |
| Sad | Sad |
| Angry | Angry |
| Fear | Anxious |
| Surprised | Anxious |
| Disgust | Stressed |
| Contempt | Stressed |

### Dataset & Training

The YOLO11n model was trained using a dataset containing approximately **70,000 images** for facial expression recognition.

The trained model weights are stored at:

`emotion-service/models/best.pt`

### Detection Workflow

1. The user opens the Emotion Detection page.
2. The browser accesses the webcam with user permission.
3. Still image frames are captured periodically.
4. Frames are sent to the MoodQuest Node.js backend.
5. The backend forwards the frames to the Python FastAPI emotion service.
6. YOLO11n processes the images and predicts a facial expression.
7. The detected expression is mapped to a MoodQuest mood.
8. Confidence-filtered mood observations can be saved in PostgreSQL.

**Note:** Facial expression recognition estimates visible expressions. It does not reliably determine a person's actual emotional state or provide a clinical diagnosis. Users can also manually select their mood.

---

## Architecture

```
┌──────────────────────────── Browser ────────────────────────────┐
│ React + TypeScript (Vite)                                       │
│  pages/ ─► services/ (Axios) ─► lib/api.ts                      │
│           (JWT header · 401 → logout · user-safe error text)    │
└────────────────────────────────┬────────────────────────────────┘
                                 │ JSON over HTTP (CORS = FRONTEND_URL)
┌────────────────────────────────▼────────────────────────────────┐
│ Node.js + Express 5 (TypeScript)                                │
│  routes/        URL → middleware → controller                   │
│  middleware/    requireAuth (JWT + revocation) · validate (Zod) │
│                 rate limit · error handler ({ detail } JSON)    │
│  controllers/   thin HTTP adapters                              │
│  services/      business logic: auth, mood, progress, chat,     │
│                 assistant*, recommendation*, emotion*, catalog  │
│                 (* = swappable provider interfaces)             │
│  utils/serializers.ts   DB rows → stable API JSON (snake_case)  │
└────────────────────────────────┬────────────────────────────────┘
                                 ▼
                  Prisma ORM (driver adapter: node-postgres)
                                 ▼
                             PostgreSQL
```

- **The API contract is stable.** Routes, payloads and the `{ "detail": "…" }` error format are what the React service layer expects; serializers keep database naming separate from the JSON the frontend sees.
- **Provider interfaces.** `AssistantProvider`, `RecommendationProvider` and `EmotionAnalyzer` are small interfaces. The app ships `GroqAssistant` (with `RuleBasedAssistant` as fallback), `CatalogProvider`, and no emotion analyzer yet; implementations are selected with environment settings.
- **Authorization by ownership.** Every user-owned query filters by `userId`; another user's IDs return 404.
- **Timezone-aware analytics.** Streaks and daily charts are grouped by the user's profile timezone.
- **Catalog seeding.** Games, activities and recommendation records are reference content, seeded idempotently on startup (or with `npm run db:seed`).

---

## Tech stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Axios, Recharts, Lucide React, Vitest + Testing Library.

**Backend:** Node.js (≥ 20.19), Express 5, TypeScript, Prisma ORM 7 (`@prisma/adapter-pg`), PostgreSQL, Zod (validation), jsonwebtoken (JWT, HS256), bcryptjs (password hashing), Helmet, CORS, express-rate-limit, Multer, Vitest + Supertest.

---

## Folder structure

```
MoodQuest/
├── frontend/
│   ├── src/
│   │   ├── components/   ui/ navigation/ mood/ chat/ media/ games/ charts/ illustrations/
│   │   ├── pages/        one file per screen
│   │   ├── layouts/      AppLayout (sidebar + bottom nav), AuthLayout
│   │   ├── services/     typed API clients (auth, mood, chat, recommendation, game, …)
│   │   ├── contexts/     AuthContext (session restore), ToastContext
│   │   ├── hooks/        useAsync, useCamera, useDebounce
│   │   ├── types/        API response types
│   │   ├── utils/  lib/  test/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        data model
│   │   ├── migrations/          SQL migrations (prisma migrate)
│   │   └── seed.ts              catalog seed
│   ├── src/
│   │   ├── server.ts            starts the HTTP server (+ catalog sync)
│   │   ├── app.ts               Express app: security, CORS, routes, errors
│   │   ├── config/env.ts        validated environment variables
│   │   ├── lib/prisma.ts        Prisma client
│   │   ├── routes/              one router per domain
│   │   ├── controllers/         request → service → response
│   │   ├── services/            business logic + provider interfaces
│   │   ├── middleware/          auth, validate, rateLimit, errorHandler
│   │   ├── schemas/             Zod request schemas
│   │   └── utils/               serializers, time, moods, httpError
│   ├── tests/                   Vitest + Supertest API tests
│   ├── prisma.config.ts
│   ├── package.json
│   └── .env.example
├── docs/screenshots/
├── README.md
└── .gitignore
```

---

## Database schema

Defined in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma). Models are camelCase in code and map to snake_case tables.



## Environment variables

`backend/.env` (copy from `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `4000`) |
| `FRONTEND_URL` | Allowed browser origin(s) for CORS, comma-separated (default `http://localhost:5173`) |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://moodquest:password@localhost:5432/moodquest` |
| `JWT_SECRET` | ≥ 32 random characters — `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `JWT_EXPIRES_IN_MINUTES` | Token lifetime (default 60) |
| `EMERGENCY_NUMBER`, `HELPLINE_NAME`, `HELPLINE_NUMBER`, `HELPLINE_AVAILABILITY` | Emergency page resources — set them for your region |
| `ASSISTANT_PROVIDER` | `groq` (real LLM) or `rule_based` (built-in replies, no key needed) |
| `GROQ_API_KEY`, `GROQ_MODEL` | Groq key from <https://console.groq.com/keys> and model (default `openai/gpt-oss-120b`) |
| `TEST_DATABASE_URL` | Separate database for the test suite (it is wiped between tests) |

The server refuses to start with a clear message if a required variable is missing or invalid.

`frontend/.env` (copy from `frontend/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL, default `http://localhost:4000` |

No secrets live in the frontend; all third-party keys (such as `GROQ_API_KEY`) belong in `backend/.env`.

---

## Setup

Prerequisites: **Node.js ≥ 20.19** and **PostgreSQL**.

### 1. Database

```sql
-- in psql or pgAdmin, as a superuser
CREATE USER moodquest WITH PASSWORD 'choose-a-password';
CREATE DATABASE moodquest OWNER moodquest;
CREATE DATABASE moodquest_test OWNER moodquest;   -- only needed for `npm test`
```

### 2. Backend

```bash
cd backend
npm install                      # also generates the Prisma client
cp .env.example .env             # then fill in DATABASE_URL, JWT_SECRET (and TEST_DATABASE_URL)
npm run db:migrate               # prisma migrate deploy — creates the tables
npm run dev                      # http://localhost:4000 (auto-reloads)
```

Catalog content (games, activities, recommendations) is seeded automatically on startup; `npm run db:seed` does it manually. Health check: <http://localhost:4000/health>.

Production: `npm run build && npm start`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                      # http://localhost:5173
```

### Useful backend scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the API with auto-reload (tsx) |
| `npm run build` / `npm start` | Compile to `dist/` / run the compiled server |
| `npm run db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `npm run db:migrate:dev -- --name <change>` | Create a new migration after editing `schema.prisma` |
| `npm run db:seed` | Seed catalog content |
| `npm test` | Run API tests against `TEST_DATABASE_URL` |
| `npm run test:unit` | Run the tests that need no database (Groq provider with a mocked API) |
| `npm run typecheck` | TypeScript check |

## Testing

```bash
# Backend — Vitest + Supertest against a real PostgreSQL test database
cd backend
npm test

# Frontend — Vitest + Testing Library
cd frontend
npm test
```

The backend suite migrates `TEST_DATABASE_URL` automatically, truncates all tables before each test, and refuses to run if `TEST_DATABASE_URL` equals `DATABASE_URL`. It covers registration, login, password hashing, JWT validation (invalid, forged, expired, revoked, deleted user), every protected route, profile & password change, emergency contacts, mood creation/listing/validation/privacy, mood statistics (trend, distribution, streaks, insights), conversations & messages, journal CRUD & authorization, games & sessions, activities & completions, recommendations (personalisation, categories, search), the emotion placeholder (501 / 415 / 401), emergency resources, health, CORS and JSON error handling.

Frontend coverage: anonymous redirect, login validation & server errors, login → dashboard with the user's name, returning to the requested page after login, session restore, expired-session handling, registration validation, mood check-in through the API, active bottom-nav state, Progress empty state, chat validation and send/receive, chat empty state, safe error messages.

---

## Future work

| Capability | Where it plugs in |
|---|---|
| LLM companion | **Done with Groq** (`GroqAssistant`). To use another model or provider, implement `AssistantProvider` in `backend/src/services/assistant.service.ts` and select it with `ASSISTANT_PROVIDER`. |
| Facial emotion recognition (OpenCV + FER2013 CNN / DeepFace) | Implement `EmotionAnalyzer` in `services/emotion.service.ts` — e.g. call a small Python model service over HTTP. `/api/emotion/analyze` already validates and receives frames from the camera page; results can be stored as `MoodLog` rows with `source = "camera"`. |
| Voice (Whisper / ElevenLabs) | Chat mic & call buttons are in place; add an audio endpoint and store transcripts as messages. |
| Mood fusion | Combine `MoodLog` rows from `manual`, `chat`, `camera` and `voice` sources. |
| Spotify / TMDB | Implement `RecommendationProvider` per type in `services/recommendation.service.ts`; store results as `Recommendation` rows with `provider`, `externalId` and optional `userId`. Keys stay server-side. |
| Crisis support | A properly evaluated classifier and escalation flow; emergency contacts are already stored per user. |

---

## Known limitations

- **The chat companion is a general-purpose LLM** (Groq) guided by a supportive system prompt; it can make mistakes and is not a therapist. Explicit self-harm phrases are intercepted by a keyword check that returns the configured helpline message instead of calling the model — this is **not** a risk classifier and triggers no notifications. If Groq is unreachable, replies fall back to the built-in keyword responses.
- Chat messages are sent to Groq to generate replies; mention this in your privacy notes.
- **No emotion detection yet.** The camera preview works; analysis returns 501 until a model is connected.
- **Recommendation artwork** is generated per title (SVG scenes) because no licensed images are bundled; links open YouTube searches until Spotify/TMDB integration.
- **Notification preferences are stored** but push/email delivery is not implemented; reminders appear in the in-app bell.
- JWTs are kept in `localStorage` for simplicity; an httpOnly-cookie session would be stronger against XSS.
- Passwords use `bcryptjs` (a pure-JavaScript bcrypt implementation, standard `$2b$` hashes, cost 12) to avoid native build issues on Windows.
- Helpline numbers are configuration — verify them for your region before deployment.
- MoodQuest is a wellness tool, **not a medical or crisis service**.
