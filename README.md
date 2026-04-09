# Medo-Veda

Medo-Veda is an AI-powered consumer health analysis platform focused on packaged food intelligence.
It reads product labels, analyzes ingredient risk, verifies marketing claims, personalizes advice by user health profile, and generates a clinical-style report.

This README is updated to match the current codebase architecture and behavior.

---

## 1) What the App Does

Medo-Veda supports:

- Product scan and analysis flow (image-first)
- Ingredient-level risk classification
- Claim vs reality verification
- Profile-aware advice (age, goals, conditions)
- Nutrition snapshot normalization and fallback
- Report history and dashboard summary
- Downloadable report PDF from report view

---

## 2) Current Architecture (High Level)

System overview:

1. Frontend (React + Vite) captures user input and polls status.
2. Backend (Node + Express) orchestrates multi-agent analysis.
3. Vision + AI agents generate structured report data.
4. PostgreSQL persists users, profiles, scans, and reports.
5. Cloudinary stores uploaded images.
6. Redis caches computed responses where applicable.

Flow summary:

1. User uploads image or submits scan request.
2. Backend starts pipeline and tracks progress by scanId.
3. Frontend polls scan status endpoint.
4. Once complete, frontend fetches final report payload.
5. Report renders in Analysis Report UI and can be exported to PDF.

---

## 3) Tech Stack (Current)

### Frontend

- React 19
- Vite 8
- Tailwind CSS 4
- React Router
- Axios
- Framer Motion
- React Hot Toast
- html-to-image + jsPDF + html2canvas (report export)
- MUI dependencies (available in project)

### Backend

- Node.js + Express 5
- PostgreSQL (pg)
- Cloudinary
- Upstash Redis
- Multer
- Sharp
- JWT + bcryptjs
- Axios
- jsonrepair
- OpenAI SDK and Google/Vertex packages present in dependencies

### AI / Pipeline Strategy

- Vision-first orchestration
- Multi-agent pipeline with safe fallbacks and timeout wrappers
- Report assembly and output validation
- Guideline enrichment via Wikipedia-backed lookup service

---

## 4) Backend Architecture and How It Works

Core backend entry:

- Express app bootstraps middleware, routes, health checks, and timeout controls.

Important route groups:

1. Auth
   - Register and login
2. Profile
   - Setup and get profile
3. Scan lifecycle
   - Create scan
   - Poll status
   - Fetch result
   - History/list and single record
4. Dashboard summary
5. Vision/image extraction endpoints

Pipeline behavior (orchestrator):

1. Wave 1: Vision or product discovery + persona context
2. Wave 2: Ingredient + claims + web research fallback
3. Wave 3: Personalization + evidence + alternatives + verdict
4. Wave 4: Assembly of final report schema

Stability design:

- Each critical external/agent call is wrapped by a safe timeout helper.
- Fallback paths are used when an agent fails or returns sparse output.
- Guideline text is sanitized so UI receives renderable values.

---

## 5) Frontend Architecture and How It Works

Core frontend app shell:

- Route-based pages with fixed navbar and mobile bottom navigation patterns.
- Protected routes for authenticated pages.
- Mobile-safe spacing and viewport handling are implemented globally.

Key pages:

1. Landing page
2. Auth page (separate mobile/desktop layouts)
3. Dashboard
4. Scan page
5. Report loading page (status polling)
6. Analysis report page
7. History page
8. Profile setup page

Report rendering notes:

- Ingredient and nutrition values are normalized defensively.
- Personal advice is layout-optimized for mobile readability.
- PDF export path captures rendered DOM and writes a downloadable PDF.

---

## 6) Step-by-Step: Local Setup

### Prerequisites

1. Node.js 18+
2. npm
3. PostgreSQL database connection string
4. Cloudinary account keys
5. NVIDIA API keys for pipeline calls

### 6.1 Clone

```bash
git clone https://github.com/Dineshkumar2006471/Medo-veda.git
cd Medo-veda
```

### 6.2 Backend install and env

```bash
cd backend
npm install
```

Create backend .env with (current expected keys):

1. DATABASE_URL
2. JWT_SECRET
3. NVIDIA_API_KEY
4. NVIDIA_API_KEY_2
5. NVIDIA_API_KEY_3
6. CLOUDINARY_CLOUD_NAME
7. CLOUDINARY_API_KEY
8. CLOUDINARY_API_SECRET
9. UPSTASH_REDIS_REST_URL
10. UPSTASH_REDIS_REST_TOKEN
11. PORT (optional, defaults from code)
12. WIKI_CONTACT_EMAIL (optional, fallback exists)

Start backend:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3001/health
```

### 6.3 Frontend install and env

```bash
cd ../frontend
npm install
```

Create frontend .env:

1. VITE_API_URL=http://127.0.0.1:3001

Start frontend:

```bash
npm run dev
```

Open:

- http://localhost:5173

---

## 7) Step-by-Step: End-to-End Runtime Flow

1. User logs in and profile is available.
2. User uploads/starts scan.
3. Backend creates scan and starts orchestrator.
4. Frontend polls status endpoint.
5. Backend assembles final report.
6. Frontend loads Analysis Report with normalized payload.
7. User downloads PDF copy from report page.

---

## 8) Deployment Notes

### Backend

- Deploy backend folder as web service.
- Set all required env vars listed above.
- Ensure outbound access to AI and Cloudinary endpoints.

### Frontend

- Deploy frontend as Vite app.
- Set VITE_API_URL to deployed backend URL.

---

## 9) Troubleshooting

### Backend starts but DB unavailable

- Verify DATABASE_URL and SSL behavior of your host.
- Check backend logs for pool connection timeout.

### Scan stays loading

- Check scan status endpoint response.
- Confirm AI keys are set and valid.
- Check image upload path and Cloudinary env values.

### PDF download fails

- Confirm frontend build is up to date.
- Validate report page renders fully before export.
- Check browser console for DOM capture or CORS errors from external images.

---

## 10) Current Project Status

Recently stabilized areas:

1. Mobile auth and navigation behavior
2. Report rendering robustness
3. Ingredient guideline fallback/safety handling
4. Pipeline safety wrappers for external enrichment
5. PDF export flow hardening

---

## 11) License

This repository is currently used for hackathon/academic and product prototyping workflows.
