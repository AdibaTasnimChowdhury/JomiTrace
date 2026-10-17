# JomiTrace data handling

JomiTrace is a local screening prototype. Do not enter sensitive personal or production land records until the deployment has suitable authentication, authorization, encrypted storage and backups.

## Where data is stored

The backend uses `DATABASE_URL` from its environment. The default is `sqlite:///./jomitrace.db`; when the backend is started from `backend/`, the database file is `backend/jomitrace.db`. Case metadata, source records, parties, crosswalks, findings, checklists and audit events are stored in that database. The web UI sends requests to the local API; it does not maintain an independent case database.

Demo scenarios and user-entered cases share the configured database but have distinct provenance labels and ledger filters. Loading a demo scenario will replace only a matching canonical synthetic scenario. A case with the same identifier that is user-entered or otherwise does not match the canonical demo is preserved and the load is rejected. This is logical separation, not separate database files or access controls.

## Back up and restore

1. Stop the backend so SQLite is not being written during a file copy.
2. Copy the configured database file to an encrypted, access-controlled backup location. Keep the backup outside the repository and record its date.
3. Verify the copy exists and is non-empty. For a restore, stop the backend first, preserve the current database as a separate rollback copy, then place the selected backup at the configured path.
4. Start the backend and confirm the expected cases are present before resuming work.

For a database configured outside SQLite, use that database engine's consistent backup and restore procedure instead of copying a live file.

## Remove data

Deleting an individual case in the application permanently removes that case and its related records from the configured database. Export or back up anything needed first. To remove all local data, stop the backend and delete only the database file identified by the active `DATABASE_URL`; also remove any separately stored backups if they should expire. Confirm the exact path before deleting. Demo provenance does not mean data is automatically disposable.

## Security limits

The current prototype has no user accounts, role-based access control, authenticated actor identity, encryption-at-rest management, automatic backup/restore, or tamper-proof audit service. Audit event labels are local metadata and are not proof of who performed an action. SHA-256 integrity checks compare current case input with the fingerprint stored for an analysis run; they do not prove the truth or authenticity of source documents. Findings are screening prompts, not legal determinations.

Before using real records, add and review authentication, least-privilege roles, server-side authorization for every case operation, authenticated audit events, secure secret/configuration handling, encrypted backups, a retention policy and a tested recovery process.
