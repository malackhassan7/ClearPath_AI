# Merge report: Data-UI-Repair + Auth-API-Fix

Base: ClearPathAI-Data-UI-Repair (full project). Applied from ClearPathAI-Auth-API-Fix (3 files):
- `src/api/client.ts`: attaches the real JWT to every API call (ignores fake `local-token-*`).
- `src/app/session.tsx`: clears old fake sessions on start; session only counts if a real token exists.
- `src/features/auth/AuthPage.tsx`: no more silent fake login/registration; register sends the backend schema and stores real tokens; real error messages shown.

Added in this merge:
- `src/api/authRefresh.ts` + wired into `client.ts` and `httpClient.ts`: on a 401 the app uses the stored refresh token to get a new access token and retries once; if that fails it clears the session and goes to `/session-expired`. (Access tokens last 30 min, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`; before this the frontend never refreshed.)
- `src/test/authRefresh.test.ts` (3 tests).

Verified: `npm run build` passes, 21/21 tests pass. Backend/Docker not run here.

## API contract fix (second round)
Problem: the frontend called routes and expected shapes the backend does not have, and one failing query blocked every page.

- `src/api/adapters.ts` (new): converts real backend responses (snake_case, bare lists) to the frontend shapes: projects, applications to clearances, documents, notifications, users, audit logs. Bottlenecks and the workflow list are derived from the real clearances. Nothing is invented: timelines show "timeline_unavailable", validation says "Validation service not connected".
- `src/api/services.ts`: live mode now calls the routes that exist (`/projects/`, `/clearances/`, `/clearances/{id}/status`, `/documents/{application_id}`, `/notifications`, `/notifications/read-all`, `/admin/users`, `/admin/audit-logs`). Trailing slashes are used on purpose: FastAPI redirects without them and the redirect can drop the login token. Mock mode is unchanged.
- Documents are gathered per application; one failing application no longer blanks the page.
- `PageRouter.tsx`: only projects and clearances failing blocks a page; documents or notifications failing degrades to empty.
- `backend/docker-compose.yml`: CORS now also allows 127.0.0.1 and port 3001. Run `docker compose up -d` again in `backend/` to apply.
- Tests: `src/test/liveApi.test.ts` (adapters and live mode against backend-shaped responses). 25/25 tests pass, build passes. Docker and PostgreSQL were not run here.

## Document upload, replace and delete (third round)
Frontend
- `Upload document` button on the Documents page opens a dialog: pick project, pick an existing application or start a new FSSAI application (draft), name, category, file. Shows upload progress, inline errors and a Retry button.
- Replace = upload the new version first, then remove the old record, so a failed upload never loses the old file.
- Remove has a confirm step. Escape closes dialogs (not while uploading). Labels, `role="alert"` errors, `role="dialog"`.
- Client checks mirror the server: PDF/PNG/JPG, max 5 MB, not empty (`src/features/documents/fileRules.ts`).
- Live mode text no longer says files stay in the browser; demo mode keeps the simulated behaviour. Upload is also allowed for the `user`, `farmer` and `entrepreneur` roles (the backend registers people as `user`).
- New API calls: `POST /documents/{application_id}/upload` (multipart + query params), `DELETE /documents/{id}`, `POST /clearances/`.

Backend (`backend/app/api/v1/documents.py`)
- Ownership check: only the application's owner, an officer or an admin may list, upload or delete its documents (before this any signed-in user could).
- The real file content is checked (PDF/PNG/JPEG signature); a renamed .exe or .html is rejected. Stored under a server-generated name, size read is capped.
- New `DELETE /documents/{document_id}` (204), removes the file only if it is inside the upload folder.
- `docker-compose.yml`: new `uploads` volume so files survive container rebuilds.
- Tests: `backend/tests/test_file_signature.py` (3 pass). The upload route itself needs PostgreSQL, so it was not run here.

Verified: build passes, 30/30 frontend tests pass, backend signature tests pass. Docker/PostgreSQL not run here.

## Still not available (shown honestly, not faked)
- Officer query/reply threads on documents: no backend table or route yet (live mode says so).
- Document validation/OCR results: "Validation service not connected" unless a worker reports one.
- Rules registry, clearance dependencies and per-clearance timelines: not stored in the database.
- Downloading or previewing an uploaded file: no download route yet.
- Cancel button during an upload (progress and retry are done).
