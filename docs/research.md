# Product and technical research notes

## Product position
JomiTrace is a focused, explainable discrepancy-screening workflow. Its differentiator is the connection between a finding, the exact fields that triggered it, the source references, and the recorded transfer chain.

## Design conclusions
- Avoid generic dashboards: no four-metric-card row, hero banner, card around every datum, decorative icon tiles, or heavy shadows.
- Use a dense split-pane ledger: narrow operational queue and dominant searchable table.
- Treat source tags as first-class metadata.
- Align document metadata with timeline nodes.
- Highlight exact conflicting values in the comparison grid.
- Use flat “Inspect evidence” actions.
- Explain each rule and its limitations.

## Visual system
Charcoal/slate, bone/off-white, slate-gray, and restrained dark teal. Muted amber `#D97706` means review required; muted burgundy `#991B1B` means conflict detected. No purple, neon pink, blue-purple gradients, or excessive shadows.

## Typography and copy
Geist + Geist Mono preferred; Manrope is an alternative. Avoid Inter, Roboto, and Arial. Use sentence-case headings with `text-wrap: balance`. Prefer operational labels such as “Awaiting document cross-examination,” “Flagged chain-of-title gaps,” and “Inspect evidence.”

## Technical conclusions
- Deterministic rules suit a small, auditable MVP.
- Rules should return structured evidence and plain-language explanations.
- Keep rules independent of React components.
- Preserve unknown values and source units.
- Missing data should not count as a pass.
- Use stable rule codes/versions for reproducibility.
- Build synthetic scenarios before external integrations.

## Demo narrative
Open a fictional case → inspect records → run checks → follow a timeline node to its source → inspect exact conflicting values → review next steps and pending external checks → export a report.

## Naming and claims
JomiTrace is a working name; availability and trademark status have not been established. Do not claim “officially verified,” “fraud proven,” “AI detects all fraud,” or “safe to buy.” Report only what the entered data and rules support.
