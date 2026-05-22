# Release Checklist

This checklist is mandatory before any production deploy.

## 1) Build And Static Gates

- Run `npm run release:check`.
- Ensure it passes without warnings or failures.
- Confirm deploy target is Dockerfile-based on Railway.

## 2) Production Runtime Gates

- `GET /api/health` returns `{ "ok": true, ... }`.
- App is not listening on DB port (`5432`).
- No startup crash loops in Railway runtime logs.

## 3) Role-Based UX Gates

- `Buyer` can browse listings and view directory pages.
- `Seller` can submit listing details.
- `Admin` can see `Admin Console` in top navigation.
- `Moderator/Developer` can open admin moderation view.

## 4) Admin Console Gates

- Moderation queue is visible.
- `Bulk Import Businesses (CSV)` module is visible.
- CSV upload flow shows imported/skipped outcome.

## 5) Auth And Security Gates

- `AUTH_SECRET` is set in Railway variables.
- `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` are set.
- `GEMINI_API_KEY` is set and valid.
- No default credentials are used in production.

## 6) Data And Audit Gates

- `app_users` table exists in Postgres.
- `compliance_audit_logs` table exists in Postgres.
- Login/register events and audit actions are persisted.

## 7) Final Manual Smoke (2-Minute Pass)

- Login as admin.
- Open Admin Console.
- Upload a sample CSV.
- Approve/reject one pending business.
- Verify listing appears in public directory.
