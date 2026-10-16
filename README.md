# JomiTrace

JomiTrace is an explainable land-record verification and risk screening workspace built for LandTech 2026. It directly addresses **P3 Fraud & Double-Selling Detection** with an entry workflow supporting **P5 Citizen Pre-Purchase Verification**. Rather than generating black-box scores or claiming automated legal verdicts, JomiTrace reconstructs the documented chain of custody from user-entered metadata, tests deterministic rules (JT-R01 to JT-R09), surfaces discrepancies with exact field-level evidence links, and highlights avoided false alarms.

## What it does / what it does not do

### What it does:
- Reconstructs chronological chain-of-custody transfer sequences from entered record metadata.
- Executes pure, deterministic rules comparing plots, areas, dates, parties, and registration-mutation links.
- Accounts for survey generations (CS, SA, RS, BS) and unit conversions without raising false alarms.
- Provides an investigation ledger, node-based chronological timeline, and record-comparison grid.
- Exports printable verification reports documenting compared fields, limitations, and pending manual checks.

### What it does NOT do:
- Does NOT access or scrape live government portals or confidential databases.
- Does NOT claim to prove legal title, authentic ownership, or verify document authenticity.
- Does NOT produce probabilistic fraud risk scores or ungrounded generative summaries.
- Does NOT replace physical on-site verification, certified record copies, or legal counsel.

---

## Prerequisites

- **Python:** 3.12 or newer
- **Node.js:** 20.x or 24.x LTS (with npm)
- **Git:** 2.x

---

## Quick start (running locally)

### 1. Backend setup & startup (FastAPI)

From the project root:

```bash
# Navigate to backend
cd backend

# Create Python virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows Command Prompt:
.\venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server (runs on http://127.0.0.1:8000)
uvicorn app.main:app --reload --port 8000
```

Verify backend health:
- Health endpoint: `http://127.0.0.1:8000/api/health`
- Interactive OpenAPI docs: `http://127.0.0.1:8000/docs`

### 2. Frontend setup & startup (React + Vite + Tailwind CSS)

Open a second terminal window from the project root:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```

The frontend web interface will run at `http://localhost:5173`.
The Vite dev server proxies `/api` requests directly to `http://127.0.0.1:8000`.

---

## Running tests

Run the backend test suite:

```bash
# From project root with venv activated or directly via venv python:
backend\venv\Scripts\pytest backend\tests -v
```

Run frontend production build verification:

```bash
cd frontend
npm run build
```

---

## Design system & tokens

The frontend UI follows the JomiTrace v3 specifications:
- **Palette:** Surface `#F7F5EF` (bone/off-white), deep charcoal/slate `#0F172A`, slate-gray secondary text `#64748B`, restrained dark teal `#245E58`.
- **Status markers:** Muted amber `#D97706` for markers/borders with `#92400E` text (ensuring WCAG AA 4.5:1 contrast on bone); muted burgundy `#991B1B` for conflicts.
- **Typography:** Geist & Geist Mono for Latin, with Noto Sans Bengali fallback for Bangla script. Headings use sentence-case with `text-wrap: balance`.
- **Layout:** Dense split-pane ledger and timeline, avoiding generic four-card metric dashboards and decorative icons.

---

## Data sources & provenance

All demonstration cases (S1 through S8) are entirely **synthetic and fictional**. No real citizen names, National ID (NID) numbers, phone numbers, or genuine land deeds are stored or queried.

---

## AI tools disclosure

In compliance with LandTech 2026 Rule Book §9:
- **AI Coding Assistant:** Google Antigravity / Gemini was used for code scaffolding, boilerplate setup, and test structuring.
- **Human Review & Responsibility:** All architectural constraints, rule catalog definitions (`RULES.md`), and domain boundaries were designed and verified by the team.

---

## Documentation reference

Full specification documents are located in `docs/`:
- `INDEX.md` — Project documentation index
- `PRD.md` — Product requirements document (v3)
- `TRD.md` — Technical requirements document
- `RULES.md` — Deterministic rule catalog (JT-R01 to JT-R09) and scenario test matrix
- `BACKEND_SCHEMA.md` — Data model and API specifications
- `APP_FLOW.md` — Application flow and screen specifications
- `IMPLEMENTATION_PLAN.md` — Hackathon timeline and execution milestones
- `SUBMISSION_PACK.md` — Compliance matrix, concept note outline, and video script
