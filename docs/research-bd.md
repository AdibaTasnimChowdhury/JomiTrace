# Bangladesh-focused research notes

## Objective
Identify record types and cross-checks that may be relevant to Bangladesh land-record screening without presenting the prototype as an official registry or legal decision-maker.

## Research questions
1. Which identifiers distinguish parcels across relevant records?
2. Which records may contain owner, area, transfer, or mutation-related information?
3. What authorized methods exist to check authenticity and current status?
4. Which checks can be structured and which require human, legal, survey, or official review?
5. What wording avoids treating a mismatch as proof of fraud?

## Candidate field inventory
District, upazila, mouza/JL reference where available; plot/dag/survey reference; khatian/porcha reference; deed/source reference; record, registration and transfer dates; recorded area and original unit; minimal owner/buyer references; mutation reference/status as supplied; supporting tax-document reference; source provenance and reviewer notes.

Fields should be optional unless the specific record type justifies requiring them. Use synthetic labels instead of real personal identifiers in demos.

## Synthetic test hypotheses
- Different plot references where a match is expected.
- Same plot reference with overlapping dates and competing purchaser references.
- Recorded area differs across records.
- Transfer event lacks a visible predecessor in the supplied chain.
- Dates contradict the expected sequence.
- Missing fields make a rule not assessable.

These are test cases, not claims about fraud frequency or legal conclusions.

## Evidence standard
For every finding show source labels, exact fields, values as entered, triggering rule, reason for review, limitations, and next step.

## Verification discipline
Prefer current official sources for legal/procedural claims. Distinguish official instructions from secondary commentary and team assumptions. Record source and retrieval date. Do not use real private records without authorization, scrape official portals, bulk-query, or probe live systems.

## Open questions
- Which public datasets are lawfully available for testing?
- How should area units be normalized without losing source fidelity?
- Which fields are reliably comparable across record types?
- How can reviewer actions and source provenance be audited?
- What privacy safeguards are needed for a public pilot?

## v3 answers to earlier questions
- **Identifiers that distinguish parcels:** survey series + khatian + dag (+ mouza/JL); across series use a reviewer crosswalk.
- **Normalizing units without losing fidelity:** store original text; convert only exact units; regional units need a reviewer-selected basis; show tolerance.
- **Comparable fields across record types:** dag, khatian, area, party, dates, deed/mutation numbers.
- **Still open:** lawfully available public test datasets; privacy safeguards for a public pilot; whether organizers will supply sample data (ask them).
