# Release checklist

Run from the repository root unless a step says otherwise. Keep generated database files and real case data out of release artifacts.

## Required checks

- [ ] Frontend production build: `cd frontend && npm run build`
- [ ] Frontend lint: `cd frontend && npm run lint`
- [ ] Backend suite with an isolated database: on Windows PowerShell, `cd backend; $env:DATABASE_URL='sqlite://'; .\venv\Scripts\python.exe -c "import asyncio,pytest; asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy()); raise SystemExit(pytest.main(['tests','-q']))"`; elsewhere, `cd backend && DATABASE_URL=sqlite:// python -m pytest tests -q`.
- [ ] Browser workflow: start the backend and frontend; open the ledger; switch English/Bangla; load a demo scenario; inspect a finding's evidence citation; run checks; open comparison and report; confirm mobile layout; create and reopen a user-entered case; verify the demo and user-entered filters remain distinct.
- [ ] Lighthouse: audit the ledger, scenario picker, workspace findings, comparison, and guided tour at desktop and mobile widths; review accessibility, contrast, and layout findings.
- [ ] Review the generated report and visible demo provenance notice.
- [ ] Confirm backups and database paths follow [DATA_HANDLING.md](DATA_HANDLING.md).
- [ ] Record check results, environment, known limitations and any skipped steps in [RELEASE_NOTES.md](RELEASE_NOTES.md).

## Release gate

Do not describe the prototype as production-ready while identity/authentication, access controls, secure backup operations and a Bangla review of every translated state remain incomplete. Record each failed or skipped check rather than treating it as a pass.
