# JomiTrace — Demo Script & Shot List

**Maximum duration: 3 minutes**\
**Target audience: LandTech 2026 judges, P3/P5 track**

---

## Pre-demo setup checklist

- [ ] Backend running: `uvicorn app.main:app --port 8000` (show green API badge)
- [ ] Frontend running: `npm run dev` at `http://localhost:5173`
- [ ] At least S2 (duplicate transfer) and S5 (chain gap) pre-loaded in the ledger
- [ ] Language set to **English** for recording; offer Bangla toggle demo at the end
- [ ] Browser zoom at 90–100%, screen at 1440px wide or wider

---

## Shot List

### SHOT 1 — Problem framing (0:00–0:20)

**Screen:** Show the Investigation Ledger with existing cases.

**Script (narrate):**
> "Land-record checks can involve comparing many documents and transfer details. JomiTrace gives a reviewer a structured way to screen entered metadata for inconsistencies before a purchase — it flags items for follow-up and does not determine ownership."

**Action:** Point to the synthetic data notice banner. Emphasize: fictional data only.

---

### SHOT 2 — Load demonstration scenario (0:20–0:40)

**Screen:** Click "Load Demo Scenario" → select **S2 – Competing duplicate transfer**.

**Script:**
> "The prototype includes eight fictional demonstration scenarios. Let's load S2, which contains competing transfers for review."

**Action:** Scenario loads → case appears in ledger → click to open the case workspace.

---

### SHOT 3 — Run screening checks (0:40–1:00)

**Screen:** Case Workspace, Findings tab (empty — no run yet).

**Script:**
> "The workspace has 8 tabs. We start on Findings. No run yet — let's evaluate."

**Action:** Click **▶ Run screening checks** → wait ~1 second → findings appear.

---

### SHOT 4 — Inspect a conflict finding (1:00–1:25)

**Screen:** JT-R04 finding card — "Conflict detected: Competing conveyances on holding…"

**Script:**
> "JT-R04 identifies competing full-holding transfers in this fictional case. The finding shows its rule and cited record references. This is a deterministic screening result, not a legal conclusion."

**Action:** Show cited-record references, then use the Inspect control to open the Source Records tab. The current interface opens the records list rather than selecting a specific row.

---

### SHOT 5 — Ownership Timeline (1:25–1:45)

**Screen:** Click **Ownership Timeline** tab.

**Script:**
> "The timeline organizes entered transfer events chronologically. Markers connect events to screening findings; this does not establish legal ownership."

**Action:** Point to the R04 marker on the relevant event and open its linked finding.

---

### SHOT 6 — Bangla interface toggle (1:45–2:00)

**Screen:** Click **বাংলা** toggle in the top-right corner.

**Script:**
> "The interface switches to Bangla. We have localized the main navigation and common review screens; some backend-generated detail text may remain in English."

**Action:** Show Findings tab in Bangla → toggle back to English.

---

### SHOT 7 — Audit Trail & Input Fingerprint (2:00–2:20)

**Screen:** Click **Audit & Integrity** tab.

**Script:**
> "The local audit view records analysis and report export events. The SHA-256 input fingerprint compares current case input with the analyzed run; it does not authenticate documents or make audit storage tamper-proof."

**Action:** Refresh the input comparison → show whether the fingerprint matches. Point to the local-session audit timestamps.

---

### SHOT 8 — Printable report (2:20–2:45)

**Screen:** Click **Printable Report** tab → show the screening report.

**Script:**
> "The report view brings together the run's findings, cited evidence, limitations, and non-judicial disclaimer for reviewer reference. It can be printed or exported as PDF."

**Action:** Scroll through: header → findings section → comparison matrix → disclaimer → Print/Export button.

---

### SHOT 9 — Wrap-up (2:45–3:00)

**Screen:** Return to the Investigation Ledger with multiple cases visible.

**Script:**
> "JomiTrace applies ten documented deterministic screening rules to fictional scenarios, with evidence references and an audit view. It supports English and Bangla with some dynamic details still being localized. Built for LandTech 2026 by Team AN at Daffodil International University."

---

## Notes for presenter

- If a live run fails, load S2 beforehand and show pre-analyzed results.
- Emphasize "fictional data" proactively — judges care about safeguards.
- Do NOT claim the app catches all fraud. Emphasize it flags patterns for human review.
- If asked about live deployment: "No live public URL — runs locally for data privacy."
- Time check: each shot ~15–20 seconds; pause only for key interactions.
