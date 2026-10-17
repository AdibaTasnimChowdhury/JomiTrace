# Frontend

JomiTrace's browser client is a React, TypeScript, and Vite application. It provides the Investigation Ledger, case workspace, Rules & Limitations page, English/Bangla UI, and printable screening report.

## Local development

From this directory, run `npm install` once, then `npm run dev`. The client expects the local FastAPI backend at `http://localhost:8000`; see the root [README](../README.md) for backend setup and configuration.

## Release checks

- `npm run lint` runs Oxlint. Existing lint warnings are listed in `docs/RELEASE_NOTES.md`.
- `npm run build` runs TypeScript project checks and creates the Vite production build.

Do not treat a successful build as a substitute for the browser workflow, mobile accessibility review, or Bangla language review listed in `docs/RELEASE_CHECKLIST.md`.
