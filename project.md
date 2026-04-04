# MEDO VEDA — PROJECT.MD
## AI-Powered Consumer Health Intelligence Platform
### Complete Production Build Document for Replit Agent 4

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Required Accounts & API Keys](#4-required-accounts--api-keys)
5. [Environment Setup](#5-environment-setup)
6. [Database Schema](#6-database-schema)
7. [Multi-Agent Pipeline](#7-multi-agent-pipeline)
8. [Input Methods — Architecture & Workflow](#8-input-methods--architecture--workflow)
9. [Backend Implementation](#9-backend-implementation)
10. [Frontend Implementation](#10-frontend-implementation)
11. [API Endpoints Reference](#11-api-endpoints-reference)
12. [MCP Server Integration](#12-mcp-server-integration)
13. [Step-by-Step Build Guide for Replit Agent 4](#13-step-by-step-build-guide-for-replit-agent-4)
14. [Final Analysis Response Schema](#14-final-analysis-response-schema)
15. [Hackathon Demo Guide](#15-hackathon-demo-guide)

---

## 1. PROJECT OVERVIEW

### 1.1 What is Medo Veda?

Medo Veda is a consumer health intelligence platform. It analyses packaged food and health products, detects misleading marketing claims, and delivers personalized consumption advice — powered by a 9-agent AI pipeline running on Anthropic Claude.

The core problem: most consumers in India cannot decode ingredient lists. Brands exploit this with vague claims like "natural", "sugar-free", or "boosts immunity". Medo Veda cuts through that noise with structured, evidence-backed analysis personalized to each user.

### 1.2 Core Value Propositions

| Value | Description |
|---|---|
| Claim Verification | Compares brand marketing claims against actual ingredient data |
| Personalized Advice | Adapts recommendations to age, health conditions, and goals |
| Local Alternatives | Suggests affordable Indian alternatives backed by FSSAI guidelines |
| Real-time Research | Evidence Agent searches the web for current WHO and FSSAI data at runtime |
| 4 Input Methods | Barcode scan, image upload, manual text entry, voice input |

### 1.3 Target Users

- **Primary:** Indian urban consumers aged 18–45 making packaged food decisions
- **Secondary:** Parents monitoring children's nutrition intake
- **Tertiary:** Fitness-conscious users tracking supplement and health product quality

### 1.4 Platform

- Web App (Desktop + Mobile PWA)
- Both platforms share the same backend and database
- Deployed entirely on Replit infrastructure

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER                                  │
│         (Web Browser / Mobile PWA)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND LAYER                            │
│           React + Vite + Tailwind CSS                       │
│    Pages: Landing, Dashboard, Scan, Report, History,        │
│           Profile                                           │
│    Input: Barcode | Image | Text | Voice                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP / REST API
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND LAYER                             │
│              Node.js + Express                              │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              9-AGENT PIPELINE                       │  │
│   │  1. Persona → 2. Product → 3. Ingredient →          │  │
│   │  4. Claim → 5. Recommendation → 6. Evidence →       │  │
│   │  7. Alternatives → 8. Verdict → 9. Presentation     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   External Calls:                                           │
│   - Anthropic Claude API (all 9 agents)                     │
│   - Open Food Facts API (barcode lookup)                    │
│   - Google Cloud Vision API (image OCR)                     │
└───────┬─────────────────┬───────────────────┬───────────────┘
        │                 │                   │
        ▼                 ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│  PostgreSQL  │  │    Redis     │  │   Google Cloud       │
│  (Neon.tech) │  │  (Upstash)  │  │   Storage            │
│              │  │              │  │  (Image Uploads)     │
│  users       │  │  Scan cache  │  │                      │
│  personas    │  │  (24hr TTL)  │  │                      │
│  products    │  │              │  │                      │
│  scans       │  │              │  │                      │
└──────────────┘  └──────────────┘  └──────────────────────┘
```

### 2.2 Request Flow (Every Scan)

```
User submits input
       │
       ▼
Backend receives request
       │
       ├── Check Redis cache (keyed by barcode/input hash)
       │         │
       │    Cache HIT ──────────────────► Return cached result
       │         │
       │    Cache MISS
       │         │
       ▼         ▼
Fetch product data
(Open Food Facts / Google Vision OCR / direct text)
       │
       ▼
Run 9-Agent Pipeline
(Anthropic Claude API — each agent is a separate API call)
       │
       ▼
Save result to PostgreSQL (scans table)
       │
       ▼
Save result to Redis (24hr TTL)
       │
       ▼
Return final JSON to frontend
       │
       ▼
Frontend renders Analysis Report page
```

---

## 3. TECHNOLOGY STACK

### 3.1 Frontend

| Package | Version | Purpose |
|---|---|---|
| react | ^18.3 | UI framework |
| react-dom | ^18.3 | DOM rendering |
| vite | ^5.4 | Build tool |
| @vitejs/plugin-react | ^4.3 | React plugin for Vite |
| tailwindcss | ^3.4 | Utility CSS framework |
| postcss | ^8.4 | CSS processing |
| autoprefixer | ^10.4 | CSS vendor prefixes |
| react-router-dom | ^6.26 | Client-side routing |
| axios | ^1.7 | HTTP client |
| zustand | ^4.5 | State management |
| @tanstack/react-query | ^5.56 | Server state + caching |
| lucide-react | ^0.447 | Icon library |
| react-hot-toast | ^2.4 | Toast notifications |
| @zxing/library | ^0.21 | Barcode scanner (camera) |
| react-dropzone | ^14.2 | Image file upload |
| vite-plugin-pwa | ^0.20 | PWA manifest + service worker |

### 3.2 Backend

| Package | Version | Purpose |
|---|---|---|
| express | ^4.21 | Web framework |
| @anthropic-ai/sdk | ^0.27 | Claude API client |
| pg | ^8.13 | PostgreSQL client |
| ioredis | ^5.4 | Redis client |
| multer | ^1.4 | Multipart file uploads |
| @google-cloud/vision | ^4.3 | Google Vision OCR |
| bcryptjs | ^2.4 | Password hashing |
| jsonwebtoken | ^9.0 | JWT auth tokens |
| cors | ^2.8 | Cross-origin requests |
| helmet | ^7.1 | Security HTTP headers |
| express-rate-limit | ^7.4 | Rate limiting |
| dotenv | ^16.4 | Environment variables |
| zod | ^3.23 | Input validation |
| uuid | ^10.0 | UUID generation |
| axios | ^1.7 | HTTP client for external APIs |

### 3.3 Infrastructure

| Service | Provider | Purpose |
|---|---|---|
| PostgreSQL | Neon.tech | Primary relational database |
| Redis | Upstash | Scan result caching |
| Image Storage | Google Cloud Storage | Product label image uploads |
| OCR | Google Cloud Vision API | Extract text from images |
| AI Engine | Anthropic Claude | All 9 agents |
| Product Data | Open Food Facts | Barcode to ingredient data |
| Deployment | Replit Domains | Single-click hosting |

---

## 4. REQUIRED ACCOUNTS & API KEYS

### 4.1 Accounts to Create

Create accounts on all of these before starting. All have free tiers.

| Service | URL | What You Get |
|---|---|---|
| Anthropic | platform.anthropic.com | Claude API key |
| Neon.tech | neon.tech | Serverless PostgreSQL — free tier sufficient |
| Upstash | upstash.com | Redis serverless — free tier sufficient |
| Google Cloud | console.cloud.google.com | Vision API + Cloud Storage |
| Open Food Facts | No account needed | Free public barcode API |


### 4.3 Google Cloud Setup Steps

1. Go to `console.cloud.google.com`
2. Create a new project called `medo-veda`
3. Enable these two APIs:
   - **Cloud Vision API**
   - **Cloud Storage API**
4. Create a Service Account:
   - IAM & Admin → Service Accounts → Create
   - Role: `Storage Object Admin` + `Cloud Vision API User`
   - Download JSON key → save as `google-credentials.json` in project root
5. Create a Storage Bucket:
   - Cloud Storage → Buckets → Create
   - Name: `medo-veda-images`
   - Region: `asia-south1` (Mumbai — closest to Indian users)
   - Access: Uniform, Public read enabled

### 4.4 Neon Database Setup Steps

1. Go to `neon.tech` → Create project → Name it `medo-veda`
2. Copy the connection string → paste as `DATABASE_URL` in `.env`
3. Connection string format: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

### 4.5 Upstash Redis Setup Steps

1. Go to `upstash.com` → Create Database → Name it `medo-veda-cache`
2. Region: `ap-south-1` (Mumbai)
3. Copy the `REDIS_URL` (starts with `rediss://`) → paste into `.env`

---

## 5. ENVIRONMENT SETUP

### 5.1 Project Structure

```
medo-veda/
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level pages
│   │   ├── lib/               # API client, utilities
│   │   ├── store/             # Zustand state stores
│   │   ├── hooks/             # React Query hooks
│   │   └── styles/            # Global CSS, tokens
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── agents/            # All 9 agent files
│   │   ├── pipeline/          # Orchestrator
│   │   ├── routes/            # Express route handlers
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── db/                # Database connection + migrations
│   │   ├── lib/               # Claude client, Redis client, helpers
│   │   └── services/          # Open Food Facts, Vision API
│   ├── server.js
│   └── package.json
│
├── google-credentials.json    # Google Cloud service account key
├── .env                       # All environment variables
├── .gitignore
└── README.md
```

### 5.2 Installation Commands

```bash
# Root setup
mkdir medo-veda && cd medo-veda

# Frontend
mkdir frontend && cd frontend
npm create vite@latest . -- --template react
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom axios zustand @tanstack/react-query
npm install lucide-react react-hot-toast @zxing/library react-dropzone vite-plugin-pwa
cd ..

# Backend
mkdir backend && cd backend
npm init -y
npm install express @anthropic-ai/sdk pg ioredis multer
npm install @google-cloud/vision bcryptjs jsonwebtoken
npm install cors helmet express-rate-limit dotenv zod uuid axios
npm install -D nodemon
cd ..
```

### 5.3 Tailwind Config

```javascript
// frontend/tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#006B5B",
          light: "#00A878",
          surface: "#F0FAF7",
          border: "#D1E8E2",
        },
        verdict: {
          safe: "#16A34A",
          limit: "#D97706",
          avoid: "#DC2626",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    }
  },
  plugins: []
}
```

---

## 6. DATABASE SCHEMA

### 6.1 Overview

Four tables. `products` acts as a cache to avoid re-running the full AI pipeline on the same product twice. `scans` stores every analysis with a snapshot of the persona used.

### 6.2 Full SQL Schema

Run this to initialize the database. Save it as `backend/src/db/migrate.js`.

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PERSONAS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  age                  INT,
  gender               VARCHAR(20),
  health_conditions    TEXT[],   -- e.g. ['diabetes', 'hypertension']
  health_goals         TEXT[],   -- e.g. ['weight_loss', 'muscle_gain']
  dietary_preferences  TEXT[],   -- e.g. ['vegetarian', 'gluten_free']
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── PRODUCTS (cache layer) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode         VARCHAR(50) UNIQUE,
  product_name    VARCHAR(255),
  brand           VARCHAR(100),
  ingredients     JSONB,         -- raw ingredient list from source
  nutrition_data  JSONB,         -- per-serving nutrition values
  source          VARCHAR(50),   -- 'open_food_facts' | 'ocr' | 'manual'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SCANS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES products(id),
  input_method      VARCHAR(10) CHECK (
                      input_method IN ('barcode', 'image', 'text', 'voice')
                    ),
  persona_snapshot  JSONB,        -- copy of persona at time of scan
  analysis_result   JSONB NOT NULL,
  overall_verdict   VARCHAR(10) CHECK (
                      overall_verdict IN ('safe', 'limit', 'avoid')
                    ),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
```

### 6.3 Migration Script

```javascript
// backend/src/db/migrate.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
```

Add to `backend/package.json` scripts:
```json
"scripts": {
  "dev": "nodemon server.js",
  "db:migrate": "node src/db/migrate.js"
}
```

---

## 7. MULTI-AGENT PIPELINE

### 7.1 Pipeline Overview

Every user scan triggers all 9 agents in sequence. Each agent receives the output of all previous agents as context. No agent is skipped. No hardcoded data is returned.

```
Input Data
    │
    ▼
[1] Persona Agent ──────── Output: persona context object
    │
    ▼
[2] Product Agent ──────── Output: normalized product data
    │
    ▼
[3] Ingredient Agent ───── Output: classified ingredient list with risk levels
    │
    ▼
[4] Claim Agent ────────── Output: verdict for each marketing claim
    │
    ▼
[5] Recommendation Agent ─ Output: personalized intake advice
    │
    ▼
[6] Evidence Agent ──────── Output: WHO / FSSAI citations (live web search)
    │
    ▼
[7] Alternatives Agent ──── Output: 3 Indian local alternatives
    │
    ▼
[8] Verdict Agent ────────── Output: Safe / Limit / Avoid
    │
    ▼
[9] Presentation Agent ───── Output: Final formatted JSON report
    │
    ▼
Return to frontend
```

### 7.2 Agent Definitions

#### Agent 1 — Persona Agent

```
Input:  User profile from database (age, gender, conditions, goals)
        OR "no profile" flag if user hasn't set up profile

Process: Structure the user profile into a context object that
         all downstream agents can reference for personalization.
         If no profile exists, use "general adult" as default
         and flag this in the output.

Output: {
  age: number | null,
  gender: string | null,
  conditions: string[],
  goals: string[],
  dietary: string[],
  isDefault: boolean,
  riskFactors: string[]   // derived risk flags e.g. "diabetic — watch sugar"
}
```

#### Agent 2 — Product Agent

```
Input:  Raw input data (barcode string / OCR text / manual text / voice transcript)
        Source type ('barcode' | 'image' | 'text' | 'voice')

Process: Normalize all input into a consistent product data structure.
         For barcodes: fetch from Open Food Facts API.
         For all others: parse the text to extract product name,
         brand, ingredients list, and any nutritional values.
         If data is incomplete, note what is missing.

Output: {
  productName: string,
  brand: string | null,
  barcode: string | null,
  ingredients: string[],
  nutritionPer100g: { calories, fat, saturatedFat, sugar, salt, protein } | null,
  marketingClaims: string[],   // claims extracted from input text
  dataCompleteness: 'full' | 'partial' | 'minimal',
  source: string
}
```

#### Agent 3 — Ingredient Analysis Agent

```
Input:  Product data from Agent 2 (ingredients list)
        Persona context from Agent 1

Process: Classify each ingredient individually.
         Apply persona context — e.g. salt is low risk for healthy adult
         but high risk for hypertensive persona.
         Identify the top 3 most concerning ingredients.

Output: {
  classified: [
    {
      name: string,
      classification: 'harmful' | 'neutral' | 'beneficial',
      riskLevel: 'low' | 'medium' | 'high',
      concern: string,          // one-line explanation
      personaRelevance: string  // why it matters for this specific user
    }
  ],
  overallRiskLevel: 'low' | 'medium' | 'high',
  topConcerns: string[]
}
```

#### Agent 4 — Claim Verification Agent

```
Input:  Marketing claims from Agent 2
        Ingredient data from Agent 3
        Product name for context

Process: For each marketing claim, compare it against the
         actual ingredient and nutrition data.
         Classify as True, Misleading, or False.
         Provide the specific reason for each verdict.

Output: {
  claims: [
    {
      claim: string,
      reality: string,
      verdict: 'true' | 'misleading' | 'false',
      reason: string
    }
  ],
  overallClaimScore: 'honest' | 'partially_misleading' | 'deceptive'
}
```

#### Agent 5 — Recommendation Agent

```
Input:  Ingredient analysis from Agent 3
        Claim verdicts from Agent 4
        Persona context from Agent 1

Process: Generate specific, personalized consumption advice.
         Safe intake must be a concrete quantity (e.g. "1 serving twice a week")
         not a vague suggestion.
         Advice must directly reference the user's conditions and goals.

Output: {
  safeIntake: string,
  frequency: string,
  personalizedNote: string,
  warnings: string[],
  bestTimeToConsume: string | null
}
```

#### Agent 6 — Evidence Agent

```
Input:  Top ingredient concerns from Agent 3
        Product category
        Persona context

Process: Use Anthropic web_search tool to find current WHO guidelines
         and FSSAI regulations relevant to the concerning ingredients.
         Do NOT make up citations. Only return what was actually found.

Tool:   web_search (Anthropic built-in tool, type: 'web_search_20250305')

Output: {
  citations: [
    {
      source: string,    // 'WHO' | 'FSSAI' | 'ICMR' | other
      guideline: string,
      relevance: string,
      url: string | null
    }
  ]
}
```

#### Agent 7 — Alternatives Agent

```
Input:  Product data from Agent 2
        Ingredient concerns from Agent 3
        Persona context from Agent 1

Process: Suggest 3 healthier alternatives.
         Must be:
         - Available in India (local or national brands)
         - Affordable (budget-conscious)
         - Genuinely better nutritionally, not just different
         One alternative should always be a homemade/whole-food option.

Output: {
  alternatives: [
    {
      name: string,
      reason: string,
      priceRange: string,    // e.g. "₹20–40 per serving"
      availability: string,  // e.g. "Available in most kirana stores"
      type: 'branded' | 'homemade' | 'whole_food'
    }
  ]
}
```

#### Agent 8 — Verdict Agent

```
Input:  All outputs from Agents 3, 4, 5
        Persona context

Process: Make a single decisive final classification.
         Safe: product is generally fine for this persona
         Limit: product is okay in moderation with specific guidance
         Avoid: product poses meaningful risk for this persona
         Must provide a 2-sentence summary explaining the verdict.

Output: {
  verdict: 'safe' | 'limit' | 'avoid',
  verdictSummary: string,
  primaryReason: string
}
```

#### Agent 9 — Presentation Agent

```
Input:  All outputs from Agents 1–8

Process: Combine all agent outputs into one clean, structured
         JSON object that matches the frontend report schema exactly.
         Remove any internal reasoning or intermediate fields.
         Ensure all required fields are present.

Output: Final report JSON (see Section 14 for full schema)
```

### 7.3 Pipeline Orchestrator Code

```javascript
// backend/src/pipeline/orchestrator.js
const { runAgent } = require('../lib/claude');
const personaAgent = require('../agents/personaAgent');
const productAgent = require('../agents/productAgent');
const ingredientAgent = require('../agents/ingredientAgent');
const claimAgent = require('../agents/claimAgent');
const recommendationAgent = require('../agents/recommendationAgent');
const evidenceAgent = require('../agents/evidenceAgent');
const alternativesAgent = require('../agents/alternativesAgent');
const verdictAgent = require('../agents/verdictAgent');
const presentationAgent = require('../agents/presentationAgent');

async function runPipeline(inputData, userProfile) {
  const context = {};
  const timings = {};
  const start = Date.now();

  console.log('[Pipeline] Starting for input type:', inputData.type);

  // Agent 1
  let t = Date.now();
  context.persona = await personaAgent(userProfile);
  timings.persona = Date.now() - t;
  console.log(`[Agent 1] Persona — ${timings.persona}ms`);

  // Agent 2
  t = Date.now();
  context.product = await productAgent(inputData, context);
  timings.product = Date.now() - t;
  console.log(`[Agent 2] Product — ${timings.product}ms`);

  // Agent 3
  t = Date.now();
  context.ingredients = await ingredientAgent(context);
  timings.ingredients = Date.now() - t;
  console.log(`[Agent 3] Ingredients — ${timings.ingredients}ms`);

  // Agent 4
  t = Date.now();
  context.claims = await claimAgent(context);
  timings.claims = Date.now() - t;
  console.log(`[Agent 4] Claims — ${timings.claims}ms`);

  // Agent 5
  t = Date.now();
  context.recommendation = await recommendationAgent(context);
  timings.recommendation = Date.now() - t;
  console.log(`[Agent 5] Recommendation — ${timings.recommendation}ms`);

  // Agent 6
  t = Date.now();
  context.evidence = await evidenceAgent(context);
  timings.evidence = Date.now() - t;
  console.log(`[Agent 6] Evidence — ${timings.evidence}ms`);

  // Agent 7
  t = Date.now();
  context.alternatives = await alternativesAgent(context);
  timings.alternatives = Date.now() - t;
  console.log(`[Agent 7] Alternatives — ${timings.alternatives}ms`);

  // Agent 8
  t = Date.now();
  context.verdict = await verdictAgent(context);
  timings.verdict = Date.now() - t;
  console.log(`[Agent 8] Verdict — ${timings.verdict}ms`);

  // Agent 9
  t = Date.now();
  const finalReport = await presentationAgent(context);
  timings.presentation = Date.now() - t;
  console.log(`[Agent 9] Presentation — ${timings.presentation}ms`);

  console.log(`[Pipeline] Complete in ${Date.now() - start}ms`);
  return finalReport;
}

module.exports = { runPipeline };
```

### 7.4 Claude Client

```javascript
// backend/src/lib/claude.js
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function runAgent(systemPrompt, userPrompt, useWebSearch = false) {
  const config = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  };

  if (useWebSearch) {
    config.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }

  const response = await client.messages.create(config);

  // Extract text content (handle both text and tool_result blocks)
  const textContent = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  // Strip markdown code fences if present
  const clean = textContent.replace(/```json\n?|\n?```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    // If JSON parse fails, retry once with explicit instruction
    const retry = await client.messages.create({
      ...config,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: textContent },
        { role: 'user', content: 'Your response must be valid JSON only. No explanation, no markdown. Return the JSON object directly.' }
      ]
    });
    const retryText = retry.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .replace(/```json\n?|\n?```/g, '')
      .trim();
    return JSON.parse(retryText);
  }
}

module.exports = { runAgent, client };
```

---

## 8. INPUT METHODS — ARCHITECTURE & WORKFLOW

This section describes exactly how each input method works from the moment the user interacts with the UI to the moment data reaches the pipeline.

---

### 8.1 Input Method 1 — Barcode Scanner

#### How It Works

The user opens the Scan page and selects the Barcode tab. The frontend activates the device camera using the `@zxing/library`. A live camera viewfinder appears. When a barcode is detected, it is decoded automatically — no button press needed. The barcode number is sent to the backend which fetches full product data from the Open Food Facts API.

#### Frontend Flow

```
User selects Barcode tab
        │
        ▼
@zxing/library requests camera permission
        │
        ▼
Camera viewfinder renders inside the tab
        │
        ▼
BrowserMultiFormatReader scans frames continuously
        │
        ▼
Barcode detected → number extracted (e.g. "8901058001470")
        │
        ▼
Camera stops, loading state begins
        │
        ▼
POST /api/scan/barcode  { barcode: "8901058001470" }
        │
        ▼
Navigate to /report/:scanId on success
```

#### Frontend Code

```javascript
// frontend/src/components/BarcodeScanner.jsx
import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useScanBarcode } from '../hooks/useScans';

export function BarcodeScanner() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const { mutate: scanBarcode, isPending } = useScanBarcode();

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    return () => readerRef.current?.reset();
  }, []);

  const startScanning = async () => {
    setScanning(true);
    try {
      await readerRef.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, err) => {
          if (result) {
            readerRef.current.reset();
            setScanning(false);
            scanBarcode({ barcode: result.getText() });
          }
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <video ref={videoRef} className="w-full max-w-sm rounded-xl" />
      {!scanning && !isPending && (
        <button onClick={startScanning}
          className="px-6 py-3 bg-brand text-white rounded-xl font-medium">
          Start Scanning
        </button>
      )}
      {isPending && <p className="text-brand">Analysing product...</p>}
    </div>
  );
}
```

#### Backend Flow

```
POST /api/scan/barcode
{ barcode: "8901058001470" }
        │
        ▼
Validate barcode (Zod: string, 8–14 digits)
        │
        ▼
Check Redis: GET scan:barcode:8901058001470
        │
   Cache HIT ──► return cached result (skip pipeline)
        │
   Cache MISS
        │
        ▼
Fetch from Open Food Facts:
GET https://world.openfoodfacts.org/api/v2/product/8901058001470.json
        │
        ▼
Extract: product_name, brands, ingredients_text,
         nutriments (energy, fat, saturated-fat, sugars, salt)
        │
        ▼
Run 9-Agent Pipeline
        │
        ▼
Save to products table (upsert by barcode)
Save to scans table
Save to Redis (TTL: 86400 seconds)
        │
        ▼
Return { scanId, result }
```

#### Open Food Facts API Call

```javascript
// backend/src/services/openFoodFacts.js
const axios = require('axios');

async function fetchByBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'MedoVeda/1.0 (health-intelligence@medoveda.com)' }
  });

  if (data.status === 0) throw new Error('Product not found in Open Food Facts');

  const p = data.product;
  return {
    productName: p.product_name || p.product_name_en || 'Unknown Product',
    brand: p.brands || null,
    barcode,
    ingredients: p.ingredients_text || '',
    nutrition: {
      calories: p.nutriments?.['energy-kcal_100g'] || null,
      fat: p.nutriments?.fat_100g || null,
      saturatedFat: p.nutriments?.['saturated-fat_100g'] || null,
      sugar: p.nutriments?.sugars_100g || null,
      salt: p.nutriments?.salt_100g || null,
      protein: p.nutriments?.proteins_100g || null,
    },
    imageUrl: p.image_front_url || null,
    source: 'open_food_facts',
  };
}

module.exports = { fetchByBarcode };
```

#### Real Example

```
User scans: Maggi 2-Minute Noodles
Barcode: 8901058001470

Open Food Facts returns:
- product_name: "Maggi 2-Minute Noodles"
- brands: "Nestlé"
- ingredients_text: "Wheat flour (Maida), Salt, Edible vegetable oil
  (Palm), Thickeners (508, 412), Acidity regulators (501, 500),
  Colour (150d). Taste maker: Iodised salt, Sugar, Starch,
  Onion powder, Spices & condiments, Hydrolysed groundnut protein,
  Maltodextrin, Acidifying agent (330)..."
- sugars_100g: 2.5
- salt_100g: 4.8   ← very high

Pipeline output:
- Verdict: LIMIT
- Top concerns: Maida (refined flour), Palm oil, High sodium
- Claim "No Added MSG" → Misleading (MSG precursors present)
- Personalized note for diabetic user: "Refined maida causes
  rapid blood sugar spikes. Limit to 1 serving per week."
```

---

### 8.2 Input Method 2 — Image Upload

#### How It Works

The user selects the Image tab and uploads a photo of the product label. The image can be taken directly from the camera or selected from the gallery. The frontend uploads the image to Google Cloud Storage. The backend then sends the Cloud Storage URL to the Google Cloud Vision API which performs OCR (Optical Character Recognition) to extract all text from the label. That extracted text is passed into the pipeline as product data.

#### Frontend Flow

```
User selects Image tab
        │
        ▼
react-dropzone renders upload zone
("Drop photo here or tap to take photo")
        │
        ▼
User selects / captures image
        │
        ▼
Preview thumbnail shown
        │
        ▼
User clicks "Analyse This Label"
        │
        ▼
FormData created with image file
POST /api/scan/image (multipart/form-data)
        │
        ▼
Loading state: "Reading label..." → "Analysing ingredients..."
        │
        ▼
Navigate to /report/:scanId on success
```

#### Frontend Code

```javascript
// frontend/src/components/ImageUpload.jsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useScanImage } from '../hooks/useScans';

export function ImageUpload() {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const { mutate: scanImage, isPending } = useScanImage();

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleAnalyse = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    scanImage(formData);
  };

  return (
    <div className="flex flex-col gap-4">
      <div {...getRootProps()} className="border-2 border-dashed border-brand-border
        rounded-xl p-8 text-center cursor-pointer hover:bg-brand-surface transition">
        <input {...getInputProps()} />
        {preview
          ? <img src={preview} className="max-h-48 mx-auto rounded-lg" alt="label" />
          : <p className="text-gray-500">Drop photo here or tap to capture</p>
        }
      </div>
      {file && !isPending && (
        <button onClick={handleAnalyse}
          className="px-6 py-3 bg-brand text-white rounded-xl font-medium">
          Analyse This Label
        </button>
      )}
      {isPending && (
        <div className="text-center text-brand">
          <p>Reading label...</p>
        </div>
      )}
    </div>
  );
}
```

#### Backend Flow

```
POST /api/scan/image
(multipart/form-data, field: 'image')
        │
        ▼
multer receives file → stored in memory buffer
        │
        ▼
Upload buffer to Google Cloud Storage:
  Bucket: medo-veda-images
  File: images/{uuid}.jpg
  Returns: public URL
        │
        ▼
Send URL to Google Cloud Vision API:
  Feature: TEXT_DETECTION
  Returns: all text found on label
        │
        ▼
Clean OCR text:
  Remove line breaks, fix common OCR errors,
  extract ingredients section if identifiable
        │
        ▼
Run 9-Agent Pipeline with OCR text as input
        │
        ▼
Save to scans table (input_method: 'image')
Save to Redis (key: scan:image:{hash of OCR text})
        │
        ▼
Return { scanId, result }
```

#### Google Vision Service Code

```javascript
// backend/src/services/visionOCR.js
const vision = require('@google-cloud/vision');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');

const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
});

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
});

async function uploadAndExtractText(fileBuffer, mimetype) {
  // Step 1: Upload to GCS
  const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);
  const filename = `images/${uuidv4()}.jpg`;
  const file = bucket.file(filename);

  await file.save(fileBuffer, {
    metadata: { contentType: mimetype },
    public: true,
  });

  const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${filename}`;

  // Step 2: OCR via Vision API
  const [result] = await visionClient.textDetection(publicUrl);
  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    throw new Error('No text detected in image. Please try a clearer photo.');
  }

  // First annotation is the full text
  const fullText = detections[0].description;
  return { text: fullText, imageUrl: publicUrl };
}

module.exports = { uploadAndExtractText };
```

#### Real Example

```
User uploads: photo of Patanjali Pure Honey label

Google Vision OCR extracts:
"PATANJALI Pure Honey
100% NATURAL | NO ADDED SUGAR
UNPROCESSED | UNFILTERED
Net Weight: 500g
Ingredients: Honey
FSSAI Lic. No. 10012021000967
Best Before: 24 months from packing"

Pipeline receives OCR text.
Product Agent extracts:
- productName: "Patanjali Pure Honey"
- brand: "Patanjali"
- ingredients: ["Honey"]
- marketingClaims: ["100% Natural", "No Added Sugar", "Unprocessed", "Unfiltered"]

Evidence Agent searches web:
→ Finds: CSE 2021 study showing Patanjali honey
   failed adulteration tests

Claim Verification:
- "100% Natural" → Misleading (adulteration history)
- "No Added Sugar" → Unverifiable from label alone → Misleading

Verdict: AVOID
```

---

### 8.3 Input Method 3 — Manual Text Entry

#### How It Works

The user selects the Text tab and types or pastes product information directly into a text area. This can be the full ingredient list copied from a website, a product description, or just the product name. The backend sends this raw text directly to the pipeline — no external API call needed for data retrieval.

#### Frontend Flow

```
User selects Text tab
        │
        ▼
Textarea renders with placeholder:
"Paste ingredients list, product name, or any
label information here..."
        │
        ▼
User types or pastes text
        │
        ▼
Character counter shows (max 2000 chars)
        │
        ▼
User clicks "Analyse"
        │
        ▼
POST /api/scan/text  { text: "..." }
        │
        ▼
Loading state with skeleton loaders
        │
        ▼
Navigate to /report/:scanId
```

#### Frontend Code

```javascript
// frontend/src/components/TextInput.jsx
import { useState } from 'react';
import { useScanText } from '../hooks/useScans';

export function TextInput() {
  const [text, setText] = useState('');
  const { mutate: scanText, isPending } = useScanText();
  const MAX = 2000;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          placeholder="Paste product name, ingredient list, or label text here..."
          rows={8}
          className="w-full p-4 border border-brand-border rounded-xl
            resize-none focus:outline-none focus:ring-2 focus:ring-brand
            text-sm leading-relaxed"
        />
        <span className="absolute bottom-3 right-3 text-xs text-gray-400">
          {text.length}/{MAX}
        </span>
      </div>
      <button
        onClick={() => scanText({ text })}
        disabled={text.trim().length < 10 || isPending}
        className="px-6 py-3 bg-brand text-white rounded-xl font-medium
          disabled:opacity-50 disabled:cursor-not-allowed">
        {isPending ? 'Analysing...' : 'Analyse'}
      </button>
    </div>
  );
}
```

#### Backend Flow

```
POST /api/scan/text
{ text: "Paper Boat Aam Panna. Ingredients: Water, Sugar,
  Raw Mango Pulp 8%, Salt, Cumin, Black Salt, Mint.
  Claims: Natural, No Artificial Colours" }
        │
        ▼
Validate (Zod: string, min 10 chars, max 2000 chars)
        │
        ▼
Check Redis: GET scan:text:{SHA256 hash of text}
        │
   Cache HIT ──► return cached result
        │
   Cache MISS
        │
        ▼
Pass text directly to pipeline as inputData
{ type: 'text', content: text }
        │
        ▼
Product Agent parses text using Claude to extract:
  - Product name
  - Ingredients list
  - Marketing claims
  - Any nutritional values mentioned
        │
        ▼
Run remaining 8 agents (3–9)
        │
        ▼
Save to scans table (input_method: 'text')
Save to Redis
        │
        ▼
Return { scanId, result }
```

#### Real Example

```
User types:
"Paper Boat Aam Panna. Ingredients: Water, Sugar, Raw
Mango Pulp 8%, Salt, Cumin, Black Salt, Mint.
Claims on pack: Natural, No Artificial Colours,
Traditional Recipe"

Product Agent extracts:
- productName: "Paper Boat Aam Panna"
- brand: "Paper Boat"
- ingredients: ["Water", "Sugar", "Raw Mango Pulp 8%",
  "Salt", "Cumin", "Black Salt", "Mint"]
- marketingClaims: ["Natural", "No Artificial Colours",
  "Traditional Recipe"]

Ingredient Agent:
- Sugar listed 2nd after water → Harmful (High)
  (indicates high sugar concentration)
- Raw Mango Pulp only 8% → despite being featured in name
- Cumin, Mint → Beneficial (Low)

Claim Agent:
- "Natural" → Reality: Sugar-first formulation,
  industrially processed → Misleading
- "No Artificial Colours" → True (no colours listed)
- "Traditional Recipe" → Marketing language,
  unverifiable → Misleading

User persona: Female, 35, weight loss goal
Recommendation: Max 1 small glass occasionally.
  One 250ml serving estimated to contain ~18g sugar —
  72% of WHO daily free sugar recommendation.

Verdict: LIMIT
```

---

### 8.4 Input Method 4 — Voice Input

#### How It Works

The user selects the Voice tab and taps the microphone button. The Web Speech API activates the device microphone and begins listening. As the user speaks, the transcript appears on screen in real time. When the user stops speaking (3 seconds of silence), recording stops automatically. The transcript is sent to the backend exactly like a text input — the pipeline treats it the same way as manual text entry, with one addition: the Product Agent looks for contextual clues in spoken language (e.g. "for kids", "I'm diabetic") to enrich persona context.

#### Frontend Flow

```
User selects Voice tab
        │
        ▼
Microphone button renders with pulse animation
        │
        ▼
User taps microphone
        │
        ▼
Browser requests microphone permission
        │
        ▼
SpeechRecognition starts, waveform animation plays
        │
        ▼
Transcript appears on screen in real time
"Analyse Horlicks Health and Nutrition Drink for kids"
        │
        ▼
3 seconds silence → recording stops automatically
        │
        ▼
Transcript shown with "Analyse" button
        │
        ▼
POST /api/scan/voice  { transcript: "..." }
        │
        ▼
Navigate to /report/:scanId
```

#### Frontend Code

```javascript
// frontend/src/components/VoiceInput.jsx
import { useState, useRef } from 'react';
import { Mic, MicOff, Circle } from 'lucide-react';
import { useScanVoice } from '../hooks/useScans';

export function VoiceInput() {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const { mutate: scanVoice, isPending } = useScanVoice();

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Voice input not supported in this browser. Use Chrome or Safari.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Indian English

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      setTranscript(text);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      setError('Microphone error. Please try again.');
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setError(null);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={listening ? stopListening : startListening}
        className={`w-20 h-20 rounded-full flex items-center justify-center
          transition-all ${listening
            ? 'bg-red-500 animate-pulse shadow-lg shadow-red-200'
            : 'bg-brand shadow-lg shadow-brand/20'}`}>
        {listening ? <MicOff size={32} color="white" /> : <Mic size={32} color="white" />}
      </button>

      <p className="text-sm text-gray-500">
        {listening ? 'Listening... tap to stop' : 'Tap to start speaking'}
      </p>

      {transcript && (
        <div className="w-full p-4 bg-brand-surface rounded-xl">
          <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {transcript && !listening && !isPending && (
        <button
          onClick={() => scanVoice({ transcript })}
          className="px-6 py-3 bg-brand text-white rounded-xl font-medium">
          Analyse
        </button>
      )}
    </div>
  );
}
```

#### Backend Flow

```
POST /api/scan/voice
{ transcript: "Analyse Horlicks Health and Nutrition Drink for kids" }
        │
        ▼
Validate (Zod: string, min 5 chars, max 500 chars)
        │
        ▼
Check for contextual clues in transcript:
  - "for kids" → flag child context
  - "I am diabetic" → extract health condition
  - "my father" → flag may be analysing for someone else
        │
        ▼
Check Redis: GET scan:voice:{SHA256 hash of transcript}
        │
   Cache HIT ──► return
        │
   Cache MISS
        │
        ▼
Pass to pipeline:
{ type: 'voice', content: transcript, voiceContext: { childFlag: true } }
        │
        ▼
Persona Agent merges voiceContext into persona
  (if persona exists, adds voice flags as supplements)
  (if no persona, uses child profile as default)
        │
        ▼
Product Agent searches Open Food Facts by product name
  (name extracted from transcript by Claude)
        │
        ▼
Run remaining agents 3–9
        │
        ▼
Presentation Agent adds note:
  "Persona inferred from voice: analysed as child profile
   based on 'for kids' in your input."
        │
        ▼
Save to scans table (input_method: 'voice')
Save to Redis
        │
        ▼
Return { scanId, result }
```

#### Real Example

```
User says:
"Analyse Horlicks Health and Nutrition Drink for kids"

Transcript captured:
"Analyse Horlicks Health and Nutrition Drink for kids"

Voice context extracted:
- Product: "Horlicks Health and Nutrition Drink"
- childFlag: true

Product Agent searches Open Food Facts by name:
- ingredients: Sugar, Wheat flour, Milk solids, Malt extract,
  Vitamins (A, B1, B2, B3, B6, B12, C, D), Minerals
- sugar per 100g: 47.3g
- Serving size: 32g → ~15g sugar per serving

Persona Agent: Child profile applied
  (WHO: children under 18 should limit free sugar
   to <25g/day. One serving = 60% of daily limit)

Claim Agent:
- "Health & Nutrition Drink" → sugar is top ingredient → Misleading
- "Scientifically Proven Growth" → no peer-reviewed evidence
  found by Evidence Agent → False

Recommendation:
"Max 1 serving per day. Do not combine with other
 sugary foods or drinks on the same day."

Verdict: LIMIT (borderline AVOID for child profile)

Report includes yellow notice:
"Profile assumed as Child based on your voice input.
 Update your profile for more personalized advice."
```

---

## 9. BACKEND IMPLEMENTATION

### 9.1 Server Entry Point

```javascript
// backend/server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const personaRoutes = require('./src/routes/persona');
const scanRoutes = require('./src/routes/scan');
const scanHistoryRoutes = require('./src/routes/history');

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting on scan routes
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  message: { error: 'Too many requests. Please wait before scanning again.' }
});

// Health check
app.get('/api/health', async (req, res) => {
  const { pool } = require('./src/db/db');
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/persona', personaRoutes);
app.use('/api/scan', scanLimiter, scanRoutes);
app.use('/api/scans', scanHistoryRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 9.2 Database Connection

```javascript
// backend/src/db/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

module.exports = { pool };
```

### 9.3 Redis Connection

```javascript
// backend/src/lib/redis.js
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  tls: {},
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => console.error('Redis error:', err));

const CACHE_TTL = 86400; // 24 hours

async function getCache(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

async function setCache(key, value) {
  await redis.setex(key, CACHE_TTL, JSON.stringify(value));
}

module.exports = { redis, getCache, setCache };
```

### 9.4 Auth Middleware

```javascript
// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../db/db');

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!rows[0]) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticate };
```

### 9.5 Scan Routes

```javascript
// backend/src/routes/scan.js
const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { runPipeline } = require('../pipeline/orchestrator');
const { fetchByBarcode } = require('../services/openFoodFacts');
const { uploadAndExtractText } = require('../services/visionOCR');
const { getCache, setCache } = require('../lib/redis');
const { pool } = require('../db/db');
const crypto = require('crypto');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Get user persona helper
async function getUserPersona(userId) {
  const { rows } = await pool.query('SELECT * FROM personas WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

// Save scan helper
async function saveScan(userId, inputMethod, analysisResult, productId = null) {
  const { rows } = await pool.query(
    `INSERT INTO scans (user_id, product_id, input_method, analysis_result, overall_verdict)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [userId, productId, inputMethod, JSON.stringify(analysisResult), analysisResult.verdict]
  );
  return rows[0].id;
}

// POST /api/scan/barcode
router.post('/barcode', authenticate, async (req, res, next) => {
  try {
    const { barcode } = z.object({ barcode: z.string().min(8).max(14) }).parse(req.body);

    const cacheKey = `scan:barcode:${barcode}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const productData = await fetchByBarcode(barcode);
    const persona = await getUserPersona(req.user.id);
    const result = await runPipeline({ type: 'barcode', content: productData }, persona);

    const scanId = await saveScan(req.user.id, 'barcode', result);
    await setCache(cacheKey, { scanId, result });

    res.json({ scanId, result });
  } catch (err) { next(err); }
});

// POST /api/scan/image
router.post('/image', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const { text, imageUrl } = await uploadAndExtractText(req.file.buffer, req.file.mimetype);
    const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
    const cacheKey = `scan:image:${hash}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const persona = await getUserPersona(req.user.id);
    const result = await runPipeline({ type: 'image', content: text, imageUrl }, persona);

    const scanId = await saveScan(req.user.id, 'image', result);
    await setCache(cacheKey, { scanId, result });

    res.json({ scanId, result });
  } catch (err) { next(err); }
});

// POST /api/scan/text
router.post('/text', authenticate, async (req, res, next) => {
  try {
    const { text } = z.object({ text: z.string().min(10).max(2000) }).parse(req.body);
    const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
    const cacheKey = `scan:text:${hash}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const persona = await getUserPersona(req.user.id);
    const result = await runPipeline({ type: 'text', content: text }, persona);

    const scanId = await saveScan(req.user.id, 'text', result);
    await setCache(cacheKey, { scanId, result });

    res.json({ scanId, result });
  } catch (err) { next(err); }
});

// POST /api/scan/voice
router.post('/voice', authenticate, async (req, res, next) => {
  try {
    const { transcript } = z.object({ transcript: z.string().min(5).max(500) }).parse(req.body);
    const hash = crypto.createHash('sha256').update(transcript).digest('hex').slice(0, 16);
    const cacheKey = `scan:voice:${hash}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const persona = await getUserPersona(req.user.id);
    const result = await runPipeline({ type: 'voice', content: transcript }, persona);

    const scanId = await saveScan(req.user.id, 'voice', result);
    await setCache(cacheKey, { scanId, result });

    res.json({ scanId, result });
  } catch (err) { next(err); }
});

module.exports = router;
```

---

## 10. FRONTEND IMPLEMENTATION

### 10.1 Page Structure

```
src/pages/
├── LandingPage.jsx       # Public homepage with hero and CTA
├── LoginPage.jsx         # Login form
├── RegisterPage.jsx      # Registration form
├── DashboardPage.jsx     # Logged-in home, recent scans
├── ScanPage.jsx          # 4-tab input page
├── ReportPage.jsx        # Analysis report (fetches by scanId)
├── HistoryPage.jsx       # Full scan history with search/filter
└── ProfilePage.jsx       # Persona setup (3-step form)
```

### 10.2 API Client

```javascript
// frontend/src/lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### 10.3 React Query Hooks

```javascript
// frontend/src/hooks/useScans.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

function useScanMutation(endpoint, isFormData = false) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(endpoint, data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    ),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['scans'] });
      navigate(`/report/${data.scanId}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Analysis failed'),
  });
}

export const useScanBarcode = () => useScanMutation('/api/scan/barcode');
export const useScanImage = () => useScanMutation('/api/scan/image', true);
export const useScanText = () => useScanMutation('/api/scan/text');
export const useScanVoice = () => useScanMutation('/api/scan/voice');

export function useReport(scanId) {
  return useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => api.get(`/api/scans/${scanId}`).then(r => r.data),
    enabled: !!scanId,
  });
}

export function useScanHistory() {
  return useQuery({
    queryKey: ['scans'],
    queryFn: () => api.get('/api/scans').then(r => r.data),
  });
}
```

---

## 11. API ENDPOINTS REFERENCE

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/auth/me | JWT | Get current user |
| POST | /api/persona | JWT | Save/update persona |
| GET | /api/persona | JWT | Get user persona |
| POST | /api/scan/barcode | JWT | Scan by barcode number |
| POST | /api/scan/image | JWT | Upload label image |
| POST | /api/scan/text | JWT | Analyse by text input |
| POST | /api/scan/voice | JWT | Analyse by voice transcript |
| GET | /api/scans | JWT | Get scan history (paginated) |
| GET | /api/scans/:id | JWT | Get single scan result |
| GET | /api/health | Public | Server + DB health check |

---

## 12. MCP SERVER INTEGRATION

### 12.1 Google Stitch MCP (Frontend UI)

Connect Google Stitch MCP to Replit Agent 4 for frontend UI generation.

**Steps:**
1. In Replit, go to Tools → MCP Servers → Add
2. Search "Google Stitch"
3. Authenticate with Google account
4. Tell Agent 4: "Use Google Stitch MCP to generate the frontend UI. The design aesthetic is Clean Medical — white backgrounds, deep teal (#006B5B) primary color, Inter font. Build all 6 pages listed in Section 10.1."

### 12.2 Anthropic Web Search (Evidence Agent)

No separate MCP connection needed. The web_search tool is built into the Anthropic API.

Enable it in the Evidence Agent only:

```javascript
// backend/src/agents/evidenceAgent.js
const { client } = require('../lib/claude');

async function evidenceAgent(context) {
  const { ingredients } = context;
  const topConcerns = ingredients.topConcerns.join(', ');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: `You are the Evidence Agent for a health intelligence platform.
             Search for current WHO guidelines and FSSAI regulations for the
             ingredients provided. Return ONLY a JSON object with citations.
             Do not fabricate citations. Only include what you actually find.`,
    messages: [{
      role: 'user',
      content: `Find WHO and FSSAI guidelines for these ingredients: ${topConcerns}.
                Return JSON: { "citations": [{ "source", "guideline", "relevance", "url" }] }`
    }]
  });

  const textContent = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .replace(/```json\n?|\n?```/g, '')
    .trim();

  try {
    return JSON.parse(textContent);
  } catch {
    return { citations: [] };
  }
}

module.exports = evidenceAgent;
```

---

## 13. STEP-BY-STEP BUILD GUIDE FOR REPLIT AGENT 4

Give these to Agent 4 in order. One step per message. Enable Plan Mode first.

---

### PHASE 1 — Project Scaffold

**Step 1:**
> "Create a project called medo-veda with two directories: /frontend (React + Vite + Tailwind) and /backend (Node.js + Express). Create a .env file at root using the exact variable list from Section 4.2. Create .gitignore excluding .env, node_modules, google-credentials.json. Install all packages from Section 3.1 for frontend and Section 3.2 for backend. Confirm structure is ready before proceeding."

**Step 2:**
> "Connect Google Stitch MCP server. Generate the complete frontend using a Clean Medical design system: white backgrounds, deep teal #006B5B primary, Inter font, no gradients, flat cards with soft shadows. Build all 6 pages: Landing, Dashboard, Scan (4-tab layout), Report, History, Profile (3-step form). Save all output to frontend/src/."

---

### PHASE 2 — Database & Auth

**Step 3:**
> "Create backend/src/db/db.js with a PostgreSQL pool using DATABASE_URL from environment. Create backend/src/db/schema.sql with the full schema from Section 6.2 exactly as written. Create backend/src/db/migrate.js that runs the schema file. Add db:migrate to package.json scripts. Run the migration."

**Step 4:**
> "Build /api/auth/register and /api/auth/login using bcryptjs (12 rounds) and JWT (7-day expiry). Build GET /api/auth/me. Create backend/src/middleware/auth.js that verifies JWT and attaches user to req.user. Use Zod for validation on all auth routes."

**Step 5:**
> "Build POST /api/persona and GET /api/persona. Fields: age (number), gender (string), health_conditions (string array), health_goals (string array), dietary_preferences (string array). Upsert to personas table keyed by user_id. Requires JWT auth."

---

### PHASE 3 — External Services

**Step 6:**
> "Create backend/src/services/openFoodFacts.js using the exact code from Section 8.1 that fetches product data by barcode from world.openfoodfacts.org/api/v2/product/{barcode}.json. Handle 404 (product not found) gracefully."

**Step 7:**
> "Create backend/src/services/visionOCR.js using the exact code from Section 8.2. It must: (1) upload image buffer to Google Cloud Storage bucket medo-veda-images, (2) call Google Cloud Vision textDetection on the uploaded URL, (3) return the extracted text and the public image URL. Use google-credentials.json for auth."

**Step 8:**
> "Create backend/src/lib/redis.js using ioredis connected to REDIS_URL. Export getCache(key) and setCache(key, value) functions. TTL is 86400 seconds. Create backend/src/lib/claude.js with the runAgent function from Section 7.4 exactly — including the JSON retry logic."

---

### PHASE 4 — Multi-Agent Pipeline

**Step 9:**
> "Create all 9 agent files in backend/src/agents/. Each agent is an async function that accepts the context object and returns structured JSON. System prompt for every agent must instruct Claude to respond ONLY in valid JSON with no markdown. Use the agent definitions from Section 7.2 as the exact specification for each agent's input, process, and output shape."

**Step 10:**
> "Create backend/src/pipeline/orchestrator.js using the exact code from Section 7.3. It must run all 9 agents in sequence, passing cumulative context forward. Add console.log timing for each agent. The Evidence Agent (Agent 6) must use useWebSearch=true when calling runAgent."

**Step 11:**
> "Build all 4 scan routes in backend/src/routes/scan.js using the exact code from Section 9.5. Each route must: validate input with Zod, check Redis cache first, run the pipeline on cache miss, save to scans table, save to Redis, return { scanId, result }."

---

### PHASE 5 — Frontend Integration

**Step 12:**
> "Create frontend/src/lib/api.js with the axios instance from Section 10.2. Create frontend/src/hooks/useScans.js with all React Query hooks from Section 10.3. Wire up all 4 scan components (BarcodeScanner, ImageUpload, TextInput, VoiceInput) from Section 8 to their respective hooks."

**Step 13:**
> "Build the ReportPage at /report/:scanId. Fetch the scan using useReport(scanId). Display at the top: product name + large verdict badge (green/amber/red based on safe/limit/avoid). Below in a bento grid: (1) Ingredient risk table with color-coded rows, (2) Claim cards in 3-column grid each showing claim text + reality + verdict badge, (3) Personalized advice card, (4) Alternatives carousel with 3 cards, (5) Evidence citations at bottom. Show skeleton loaders while data is loading."

---

### PHASE 6 — Polish & Deploy

**Step 14:**
> "Add helmet.js, express-rate-limit (100 requests per 15 minutes on /api/scan routes), and input validation to all routes. Add a GET /api/health endpoint that checks database connectivity. Configure CORS to allow only FRONTEND_URL."

**Step 15:**
> "Configure vite-plugin-pwa: app name 'Medo Veda', theme_color '#006B5B', background_color '#FFFFFF', icons at 192x192 and 512x512. Create a VITE_API_URL environment variable in frontend pointing to the backend URL. Enable Replit Domains for deployment. Document both required API keys in README.md."

---

## 14. FINAL ANALYSIS RESPONSE SCHEMA

This is the exact JSON shape that Agent 9 (Presentation Agent) must return and the frontend Report page must consume. Both sides must match this schema exactly.

```json
{
  "product": {
    "name": "string",
    "brand": "string | null",
    "barcode": "string | null",
    "imageUrl": "string | null",
    "riskLevel": "low | medium | high",
    "dataCompleteness": "full | partial | minimal"
  },
  "ingredients": [
    {
      "name": "string",
      "classification": "harmful | neutral | beneficial",
      "riskLevel": "low | medium | high",
      "concern": "string",
      "personaRelevance": "string"
    }
  ],
  "claims": [
    {
      "claim": "string",
      "reality": "string",
      "verdict": "true | misleading | false",
      "reason": "string"
    }
  ],
  "recommendation": {
    "safeIntake": "string",
    "frequency": "string",
    "personalizedNote": "string",
    "warnings": ["string"],
    "bestTimeToConsume": "string | null"
  },
  "evidence": [
    {
      "source": "string",
      "guideline": "string",
      "relevance": "string",
      "url": "string | null"
    }
  ],
  "alternatives": [
    {
      "name": "string",
      "reason": "string",
      "priceRange": "string",
      "availability": "string",
      "type": "branded | homemade | whole_food"
    }
  ],
  "verdict": "safe | limit | avoid",
  "verdictSummary": "string",
  "primaryReason": "string",
  "personaNote": "string | null",
  "inputMethod": "barcode | image | text | voice",
  "analysedAt": "ISO 8601 timestamp"
}
```

---

## 15. HACKATHON DEMO GUIDE

### 15.1 Demo Flow (5 Minutes)

1. **Landing Page (30s)** — Explain the problem. "Most people can't read ingredient lists. Brands exploit that."
2. **Profile Setup (30s)** — Enter: Age 28, diabetic, goal = reduce sugar. This is the persona.
3. **Barcode Scan (60s)** — Scan Maggi noodles. Show 4 input tabs. Point out skeleton loaders while agents run.
4. **Report Page (90s)** — Lead with LIMIT badge. Walk through: ingredient table (highlight Maida + high salt), "No Added MSG" claim card (False verdict). Show personalized diabetic advice. Show WHO citation card.
5. **Alternatives (30s)** — Bambino vermicelli, homemade poha, millet noodles.
6. **History Page (20s)** — Show scan was saved, searchable, filterable.
7. **Closing (20s)** — "Real-time WHO and FSSAI data. Personalized to your health profile. Not a wellness app — a decision intelligence tool."

### 15.2 Test Products by Input Method

| Input Method | Product | Expected Verdict |
|---|---|---|
| Barcode | Maggi 2-Minute Noodles (8901058001470) | LIMIT |
| Image | Patanjali Pure Honey label photo | AVOID |
| Text | "Paper Boat Aam Panna. Ingredients: Water, Sugar, Raw Mango Pulp 8%..." | LIMIT |
| Voice | "Analyse Horlicks Health and Nutrition Drink for kids" | LIMIT |
| Barcode | Tata Sampann Turmeric (for contrast) | SAFE |

### 15.3 Key Differentiators to Highlight

- **Real-time research** — Evidence Agent searches the web at runtime. Not a static database.
- **Claim Verification** — The only feature that directly calls out brand deception with evidence.
- **India-first** — FSSAI guidelines, Indian alternatives, Indian products. Not a Western tool repurposed.
- **Persona-personalized** — Same product gives different advice for a diabetic vs a healthy adult.
- **4 input methods** — Zero friction to get an analysis regardless of how the user encounters a product.

---

*Medo Veda — project.md v2.0 | Complete Production Build Document*
*Platform: Web + Mobile PWA | Backend: Node.js + Express | Database: Neon PostgreSQL + Upstash Redis*
