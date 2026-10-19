# JomiTrace

## Submission links

- [Live url](https://jomitrace.netlify.app/)
- [Project demo video](https://youtu.be/3aERPFNS3N4)
- [Concept note](https://drive.google.com/file/d/1PNQUT-Py1zP01GnI8EOZFe207WSE5cv_/view?usp=sharing)

> **Explainable land-record discrepancy screening for Bangladesh**
>
> Built for the [LandTech 2026 Hackathon](https://landtech.daffodilvarsity.edu.bd/) at Daffodil International University.
> **Selected problem statement: P3 – Fraud & Double-Selling Detection.** The pre-purchase checklist is a supporting user workflow; JomiTrace is not an official ownership-verification service.

---

## What it does / what it does NOT do

### ✅ What it does

- Reconstructs the chronological chain-of-custody transfer sequence from user-entered record metadata.
- Executes **10 pure, deterministic rules** (JT-R01 to JT-R10) comparing plots, areas, dates, parties, and registration-mutation links.
- Accounts for Bangladesh survey generations (CS, SA, RS, BS) and supported area-unit conversions (decimal/acre/sq ft), with explicit limitations.
- Provides an **Investigation Ledger**, node-based **Ownership Timeline**, horizontal **Record Comparison Grid**, and **External Review Checklist**.
- Generates **printable screening reports** with cited evidence, limitations, and mandatory non-judicial disclaimers.
- Records a SHA-256 input fingerprint per analysis run and a local audit history; neither proves source authenticity nor provides tamper-proof audit storage.
- Supports full **English and Bangla (বাংলা)** interface switching.
- Ships 8 canonical **demonstration scenarios** (S1–S8) covering duplicate transfers, chain gaps, over-conveyance, date anomalies, and more.

### ❌ What it does NOT do

- Does NOT access or scrape live government portals (BRS, DLRS, e-Porcha, e-Namjari, DLR).
- Does NOT claim to prove legal title, authentic ownership, or verify document authenticity.
- Does NOT produce probabilistic fraud risk scores or ungrounded generative summaries.
- Does NOT replace physical on-site verification, certified record copies, or legal counsel.
> Planned extensions are listed under [Scope decisions & future work](#scope-decisions--future-work).
---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.12 or newer |
| Node.js | 20.x or 24.x LTS |
| npm | 10.x+ (bundled with Node) |
| Git | 2.x |

---

## Quick start (running locally)

### 1. Backend setup (FastAPI + SQLite)

```bash
# From the project root:
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# Or on macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`.
API docs (Swagger UI): `http://localhost:8000/docs`.

The backend reads configuration from process environment variables such as `DATABASE_URL` and `CORS_ORIGINS`; defaults are set in `backend/app/core/config.py`. When started from the `backend` directory, the default SQLite URL creates or opens `backend/jomitrace.db`. Back up any database you need to keep before changing its path or running an alternate copy of the app. The application initializes missing tables on startup; it does not seed demo cases until a scenario is explicitly loaded.

### 2. Frontend setup (React + Vite)

```bash
# From the project root:
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Load demo scenarios

Once both servers are running, click **"Load Demo Scenario"** in the Investigation Ledger to load any of S1–S8, then click a case to open it and press **▶ Run screening checks**.

---

## Demo Scenarios (S1–S8)

| ID | Case Code | Primary Discrepancy |
|---|---|---|
| **S1** | JT-S1 | Clean 3-link continuous chain (no flags) |
| **S2** | JT-S2 | Competing duplicate transfer of same holding |
| **S3** | JT-S3 | Over-conveyance — sold area exceeds khatian area |
| **S4** | JT-S4 | Unit conversion: one valid, one 12% mismatch |
| **S5** | JT-S5 | Chain gap — 3rd seller never appeared as buyer |
| **S6** | JT-S6 | Mutation mismatch + rapid resale within 14 days |
| **S7** | JT-S7 | Records with blank / incomplete mandatory fields |
| **S8** | JT-S8 | Cross-series RS khatian vs BS deed without crosswalk |

All scenarios use **entirely synthetic (fictional) data** with no real parties, deeds, or land records.

---

## Deterministic Rules (JT-R01 to JT-R10)

| Rule | Category | What it checks |
|---|---|---|
| **JT-R01** | Plot mismatch | Dag number inconsistency across documents |
| **JT-R02** | Area discrepancy | Area mismatch with unit-conversion tolerance |
| **JT-R03** | Chain gap | Seller in transfer N was never confirmed buyer in N-1 |
| **JT-R04** | Duplicate sale | Competing conveyances on the same holding |
| **JT-R05** | Over-conveyance | Total conveyed area exceeds recorded khatian area |
| **JT-R06** | Registration date sequence | Checks future registration dates and linked mutation registrations before cited deed registration |
| **JT-R07** | Registration–mutation link | Compares linked parties and areas; missing mutation data is insufficient information unless other deed links are available for comparison |
| **JT-R08** | Rapid transfer | Re-sale within configurable threshold (default 30 days) |
| **JT-R09** | Missing mandatory field | Reports required metadata missing for each record type |
| **JT-R10** | Document hash reuse | Identical SHA-256 hash registered to different parties |

Each rule produces one of four outcomes: **Conflict detected**, **Review required**, **Insufficient information**, or **No inconsistency found**.

---

## Architecture

```
jomitrace/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py           # ASGI entry-point, CORS, router registration
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── api/              # Route handlers (cases, records, analysis, audit…)
│   │   ├── rules/            # Deterministic rule implementations (r01–r10)
│   │   ├── services/         # Analysis orchestration, scenario loader, reports
│   │   └── db/session.py     # SQLite engine + session factory
│   └── tests/                # pytest test suite
│
├── frontend/                 # React + TypeScript + Vite application
│   ├── src/
│   │   ├── App.tsx           # Root component: nav, health check, guided tour
│   │   ├── api/client.ts     # Typed API client (fetch wrapper)
│   │   ├── locales/index.ts  # EN/BN translation dictionary + helper functions
│   │   ├── types/            # Shared TypeScript interfaces
│   │   └── components/
│   │       ├── common/       # StatusBadge, Modal, GuidedTour
│   │       ├── ledger/       # CaseLedger, CreateCaseModal, LoadScenarioModal
│   │       ├── rules/        # RulesCatalogView
│   │       └── workspace/    # CaseWorkspace, FindingsView, TimelineView,
│   │                         # ComparisonView, ChecklistView, AuditView,
│   │                         # ReportView, RecordsView, PartiesView
│   └── vite.config.ts
│
├── docs/                     # Project documentation
│   ├── PRD.md                # Product Requirements Document
│   ├── TRD.md                # Technical Requirements Document
│   ├── RULES.md              # Rule definitions and test vectors
│   ├── APP_FLOW.md           # Navigation and workflow diagrams
│   ├── CONCEPT_NOTE.md       # Hackathon submission concept note
│   └── DEMO_SCRIPT.md        # 3-minute demo shot list
│
└── backend/jomitrace.db     # SQLite database, relative to backend working directory
```

**Storage:** SQLite (single file, no external database needed); default path is relative to the backend working directory.
**Auth:** None — prototype scope.
**Deployment:** https://jomitrace.netlify.app/

---

## Running tests

### Backend (pytest)

```bash
cd backend
.\venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
python -m pytest tests/ -v
```

Run the commands above for current results. The dated result and any skipped release checks are recorded in [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md).

### Frontend (lint + build)

```bash
cd frontend
npm run lint     # oxlint — expect 0 errors; existing warnings may be printed
npm run build    # Vite production build — expect 0 errors
```

---

## Data provenance

All land records, party names, deed numbers, khatian references, and mouza names used in this application are **entirely synthetic and fictional**.

- They do not represent any real person, parcel, district, or legal document.
- No government data was scraped, mirrored, or stored.
- All data was designed for demonstration purposes only within the LandTech 2026 hackathon.

## Data sources, dependencies, and credits

- **Land-record data:** no external land-record dataset or government system is used. S1–S8 are synthetic scenarios created for demonstration; users may enter their own metadata locally.
- **Frontend sources:** [React and React DOM](https://github.com/facebook/react), [Vite](https://github.com/vitejs/vite), [Vite React plugin](https://github.com/vitejs/vite-plugin-react), [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss), [TypeScript](https://github.com/microsoft/TypeScript), [PostCSS](https://github.com/postcss/postcss), [Autoprefixer](https://github.com/postcss/autoprefixer), [Oxlint](https://github.com/oxc-project/oxc), and [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) type definitions.
- **Backend and test sources:** [FastAPI](https://github.com/fastapi/fastapi), [SQLAlchemy](https://github.com/sqlalchemy/sqlalchemy), [Pydantic](https://github.com/pydantic/pydantic), [Uvicorn](https://github.com/encode/uvicorn), [HTTPX](https://github.com/encode/httpx), and [pytest](https://github.com/pytest-dev/pytest).

Dependency versions are declared in `frontend/package.json` and `backend/requirements.txt`. The listed projects retain their respective upstream licenses; consult the linked repositories and installed package license notices before redistribution. No public land dataset or third-party land-record API is incorporated.

---

## AI tool disclosure

The following AI tools were used during development:

| Tool | Use |
|---|---|
| **Google Antigravity / Gemini** | Earlier code scaffolding, boilerplate generation, test structuring, and localization review |
| **OpenAI Codex** | Repository review, targeted frontend styling/localization fixes, documentation updates, and verification for this completion pass |

AI tools assisted development; this prototype has been deployed publicly. The deterministic rules and their limits are documented in the repository. Review the current build and test results below rather than relying on historical counts.

---

## Known limitations

1. **No live government portal integration** — all records must be manually entered. JomiTrace cannot fetch real deed or khatian data.
2. **No OCR or document parsing** — the tool evaluates entered metadata, not scanned document images.
3. **Limited party matching** — name aliases (spelling variants in Bangla/English) are flagged but not automatically resolved.
4. **No multi-user or auth support** — single-instance local deployment only.
5. **Bangla localization is not exhaustive** — common scenario and rule-engine messages have explicit translations; some dynamic values and less common screens may still contain English text.
6. **Prototype status** — not production-ready; no persistent backups, rate limiting, or role-based access control.

---

## Scope decisions & future work

JomiTrace's MVP is deliberately limited to deterministic, explainable checks on
user-entered metadata. For a screening tool where a wrong flag can harm a real
person, we chose auditability over breadth. The following are planned, not built.

| Planned improvement | Why it is deferred |
|---|---|
| **Ownership & inheritance layer** (deed → mutation → heir share checks) | Succession rules differ by religion and law; a wrong "expected share" has legal consequences. It needs a lawyer-validated rule pack that abstains when unsure. |
| **OCR / document parsing** | Scanned Bangla records are error-prone; extracted fields would need human confirmation before analysis. Manual entry keeps inputs trustworthy for now. |
| **AI-assisted name matching** (Bangla/English variants, father/spouse as tie-breaker) | Aliases are currently flagged, not resolved. Automatic matching needs labelled data and a confidence score that a human confirms. |
| **Official portal adapters** (e-Porcha, DLRS, e-Namjari) | No public API; scraping is out of scope. Needs a formal data-sharing partnership. |
| **Auth, roles, reviewer workflow** | Prototype is single-user and local. |

**Design principle:** AI may later assist with extraction and matching, but
findings will remain rule-based, evidence-linked, and human-confirmed.

---

## Team

**Team AN** · Daffodil International University
LandTech 2026 Hackathon — Selected problem statement P3

| Role | Name |
|---|---|
| Team Member | Adiba Tasnim Chowdhury |
| Team Member | Nusrat Jiban Mim |
| Industry Support Mentor | Mahabub Rahaman |
| Faculty Mentor | Md. Ashraful Islam Talukdar |
