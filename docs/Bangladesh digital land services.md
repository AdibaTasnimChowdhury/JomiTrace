# Bangladesh digital land services: domain context (v3)

## Purpose and boundary
This note identifies concepts that may matter during land due diligence in Bangladesh. It is product context, not legal advice or an authoritative statement of current procedure. Confirm requirements through appropriate official sources or qualified professionals.

## Concepts that may appear
- Deed or registered-deed reference
- Khatian/porcha reference
- Mutation-related record
- Mouza, JL number, plot/dag or survey reference
- Recorded area and original unit
- Land development tax documentation
- Survey/map and physical parcel checks
- Succession/inheritance documentation
- Encumbrance or competing-claim checks

Not every field exists in every record. Some checks require authorized official access, a qualified survey, or legal interpretation beyond the MVP.

## JomiTrace representation
1. Store a source reference and record type for each entered item.
2. Preserve values and units as transcribed.
3. Compare only when fields and units are sufficiently clear.
4. Show missing values as missing.
5. Distinguish user-entered data from external verification.
6. Attach findings to source references and compared fields.
7. Use a checklist for checks outside the app.

## Example checklist wording
- Confirm the source document and reference through an authorized channel.
- Check whether plot identifiers refer to the same parcel.
- Compare recorded area and unit across supplied records.
- Review the transfer sequence for missing links.
- Check relevant mutation-related entries.
- Review applicable tax documentation.
- Seek qualified review where inheritance, boundaries, or legal interpretation matters.

These are review prompts, not claims that every item is legally mandatory in every transaction.

## Research caution
Secondary articles can suggest questions but should not be treated as the final legal standard. Record source and date for any guidance used later. Do not scrape government portals or imply that an external checklist item was automatically checked.

## Domain facts the rules depend on (verify before quoting)
These were checked against public sources on 16 Oct 2026; re-check before putting them in the concept note.
- **Survey generations:** records exist under CS (Cadastral), SA (State Acquisition), RS (Revisional) and BS (Bangladesh Survey). Plot (dag) and khatian numbers can differ between series for the same land, so equality across series needs a mapping (rule JT-R01 uses a crosswalk).
- **Registration vs. mutation:** a registered deed is recorded at the sub-registry office; mutation (namjari) is applied for to the Assistant Commissioner (Land) through the e-mutation system, with documents such as the deed copy, tax payment proof and, where applicable, inheritance or gift documents. Practitioner commentary stresses that a khatian or mutation entry is **not itself a document of title**, which is why JomiTrace never states ownership.
- **Mutation timeline:** government notices mention a disposal period of about 45 days. JomiTrace uses this only as a configurable reference interval in R07, not as a legal deadline.
- **DCR / land development tax receipt:** issued online with a QR code after payment; treated as a supporting record, not proof of ownership.
- **Public plans:** reporting indicates the government intends to link e-registration with e-mutation so sub-registrars can check records online and AC (Land) receives registration data automatically. Treat as context, and confirm current status.
- **Portals:** e-Porcha (view khatian records), e-mutation, and the land development tax portal exist as public services. JomiTrace does **not** connect to them (Rule book §8.3-8.4); the checklist tells a reviewer to check them manually through authorized access.

## Area units
Exact: acre = 100 decimal (shotok) = 43,560 sq ft; 1 decimal = 435.6 sq ft. Katha and bigha vary regionally; make the reviewer choose the basis and record it.

## Parcel splitting
Sales of part of a holding are common. A second deed on the same holding is **not** a red flag by itself; only total conveyed area above the holding area, or two full-holding transfers, is.

## Default checklist template (seed per case)
1. Confirm each source document and reference through an authorized channel.
2. Confirm whether the plot numbers across survey series refer to the same parcel.
3. Confirm recorded area and unit on the original documents.
4. Review the transfer sequence for missing links.
5. Check the mutation entry and its disposal status through the land office or authorized portal.
6. Review land development tax receipts for the relevant years.
7. Optional pre-purchase follow-up outside JomiTrace's selected P3 scope: check pending cases, khas or acquisition status through authorized sources.
8. Seek qualified legal or survey review where inheritance, boundaries or title interpretation matter.
