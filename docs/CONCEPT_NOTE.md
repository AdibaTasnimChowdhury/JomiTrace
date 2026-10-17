# JomiTrace — Concept Note

**LandTech 2026 Hackathon | Daffodil International University**\
**Tracks: P3 – Fraud & Double-Selling Detection · P5 – Citizen Pre-Purchase Verification**\
**Team: Team AN · Daffodil International University**

---

## 1. Problem Statement

Land fraud is one of the most pervasive and economically devastating forms of crime in Bangladesh. Conservative estimates place disputed land as affecting millions of families. The most common patterns include:

- **Duplicate transfers** — the same plot sold to two or more buyers using overlapping or fabricated deeds.
- **Chain gaps** — a seller who never appeared as a buyer in any prior documented transfer, indicating an undocumented or forged title link.
- **Over-conveyance** — total area sold across multiple deeds exceeding what is recorded in the original khatian.
- **Date anomalies** — registration dates predating execution, or rapid resale sequences suggesting flip fraud.
- **Survey-series mismatches** — deeds referencing plots across CS, SA, RS, and BS survey generations without the required crosswalk confirmation.

Pre-purchase verification today is costly, slow, and requires hiring a lawyer or visiting multiple offices (Sub-Registry, AC Land, DLRS). There is no structured tool accessible to ordinary citizens to cross-check metadata from documents they already possess.

**JomiTrace targets this gap**: not by replacing official verification, but by giving citizens and intermediaries a structured way to screen the internal consistency of land-record metadata before committing to a purchase or engaging in litigation.

---

## 2. Solution Overview

JomiTrace is a web-based prototype that:

1. Accepts manually entered metadata from land documents (deeds, khatians, mutations, DCRs).
2. Executes **10 deterministic rules** (JT-R01 to JT-R10) that screen defined patterns in entered metadata; they do not replace professional or official review.
3. Produces structured findings — Conflict Detected, Review Required, Insufficient Information, or No Inconsistency Found — each linked to the specific fields and records that triggered them.
4. Generates a **printable screening report** with an SHA-256 fingerprint of the analyzed input.
5. Maintains a local activity history for analysis runs and explicit report exports. Actor labels are not authenticated and the history is not tamper-proof.

The interface provides English and Bangla, includes 8 fictional demonstration scenarios, and is designed for first-time users through a guided tour. Some generated detail text still needs human Bangla review; see release notes.

> **Important safeguard:** JomiTrace is explicitly scoped to screening and flagging. It does not produce legal verdicts, does not access government databases, and does not claim to authenticate documents.

---

## 3. Architecture

```
┌─────────────────────────────────────────┐
│           Browser (React + Vite)        │
│  ┌────────────┐  ┌────────────────────┐ │
│  │Investigation│  │  Case Workspace   │ │
│  │  Ledger    │  │  (8 tabs)         │ │
│  └─────┬──────┘  └────────┬───────────┘ │
│        │  fetch/JSON      │             │
└────────┼──────────────────┼─────────────┘
         │ HTTP (port 8000) │
┌────────┼──────────────────┼─────────────┐
│        ▼     FastAPI      ▼             │
│  ┌──────────┐    ┌─────────────────┐   │
│  │ REST API │    │  Rule Engine    │   │
│  │ Routers  │    │  JT-R01–R10     │   │
│  └────┬─────┘    └────────┬────────┘   │
│       │  SQLAlchemy ORM   │            │
│  ┌────▼───────────────────▼────────┐   │
│  │           SQLite DB             │   │
│  │  Cases · Records · Parties ·    │   │
│  │  Findings · Audit Events ·      │   │
│  │  Analysis Runs · Checklist      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Stack summary:**
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, SQLite
- **Rule Engine:** Pure Python deterministic functions — no ML, no probabilistic scoring
- **Reports:** Server-side JSON assembly; client-side print/PDF via browser

---

## 4. Track Alignment

### P3 – Fraud & Double-Selling Detection

| JomiTrace Feature | P3 Requirement |
|---|---|
| JT-R04: Competing conveyances | Detects same-holding duplicate sale |
| JT-R03: Chain gap | Flags seller with no documented prior title |
| JT-R05: Over-conveyance | Detects area inflation across multiple deeds |
| JT-R06: Date sequence | Catches backdated or post-dated registrations |
| SHA-256 input fingerprint | Lets a reviewer compare current entered input with the analyzed snapshot |
| Local activity history | Records analysis runs and explicit report exports; it does not identify an authenticated reviewer |

### P5 – Citizen Pre-Purchase Verification

| JomiTrace Feature | P5 Requirement |
|---|---|
| Guided tour + bilingual UI | Accessible to non-specialist citizens |
| 8 fictional scenarios | Demonstrations of discrepancy patterns; not accuracy benchmarks |
| Verification Checklist | Guides next steps at Sub-Registry, AC Land, etc. |
| Printable report | Document to bring to legal advisor or bank |
| Scope disclaimers | Prevents over-reliance on prototype |
| JT-R09: Missing fields | Flags incomplete documents before purchase |

---

## 5. Key Safeguards

JomiTrace is explicitly designed to avoid overclaiming. All outputs include:

- Non-judicial screening notices in every report and audit section.
- Color-coded findings with exact cited field evidence — no black-box scores.
- Limitation annotations per rule explaining what cannot be confirmed without official records.
- No connection to government portals — all data is user-entered.
- All demonstration data is **100% fictional** — no real persons, parcels, or documents.

---

## 6. Data Provenance

All land records, party names, deed numbers, khatian references, and mouza names in JomiTrace are **entirely synthetic and fictional**, created specifically for demonstration purposes. No government data was scraped or stored.

---

## 7. AI Tool Disclosure

**Google Antigravity / Gemini** was used during earlier implementation for code scaffolding, boilerplate generation, test structuring, and localization review. **OpenAI Codex** was used for this completion pass to inspect the repository, make targeted styling and localization corrections, and run available verification. AI tools assisted the work; this disclosure does not claim that every generated change received independent review.

---

## 8. Team

**Team AN** · Daffodil International University\
LandTech 2026 Hackathon — Tracks P3 and P5

| Role | Name |
|---|---|
| Team Member | Adiba Tasnim Chowdhury |
| Team Member | Nusrat Jiban Mim |
| Industry Support Mentor | Mahabub Rahaman |
| Faculty Mentor | Md. Ashraful Islam Talukdar |
