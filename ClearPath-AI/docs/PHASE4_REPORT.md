# ClearPath-TN — Phase 4 implementation report

## Scope completed

### Demo authentication API
- Added FastAPI endpoints under `/api/v1/auth`: mode, login, registration, recovery, verification, and password reset.
- SQLite stores demo users and short-lived verification-code hashes. Passwords are hashed with PBKDF2-HMAC-SHA256 and per-user random salts.
- Demo accounts exist for applicant, consultant, officer, and admin roles. All use `Demo@12345` in the local demo only; accounts and credentials are fictional.
- Login accepts email or user ID, checks credentials server-side, resets failed-attempt counters on success, locks an account for five minutes after five failed attempts, and issues an expiring HS256 bearer token.
- `Remember me` selects an 8-hour or 30-day token lifetime.
- Public registration allows applicant and consultant roles only, checks password confirmation/strength and terms, then requires demo verification.
- Forgot-user-ID and forgot-password use generic messages to avoid disclosing whether an account exists. Recovery codes are only displayed in local demo mode; no email or SMS is sent.
- Backend authorization uses the token verifier from Phase 3; the applicant token is denied from the officer/admin source-refresh route.
- The frontend HTTP client attaches the token when present; signing out and session expiry clear the local token.
- Authentication pages now use React Hook Form and Zod validation, loading/error states, password visibility, remember me, password-strength feedback, generic recovery messaging, and an explicit “Demo authentication” label.

### Project wizard
- Rebuilt the four-step wizard with React Hook Form and Zod.
- Step 1: project name, organization, contact, district, location/local body, description.
- Step 2: industry category/subcategory, enterprise category, investment range/value, employee count, project stage.
- Step 3: land/building status, built-up area, floors, machinery/process, water/electricity requirements, boiler and hazardous-material flags.
- Step 4: review of entered fields and mandatory confirmation before saving.
- Saved projects remain local demo records; the wizard does not submit to TNSWP or determine legal applicability.

## Demo credentials
All credentials below are fictional and for local development only:
- Applicant: `arun@demoprecision.example` / `Demo@12345`
- Consultant: `priya@demoprecision.example` / `Demo@12345`
- Officer: `officer@clearpath.example` / `Demo@12345`
- Admin: `admin@clearpath.example` / `Demo@12345`

## Important security boundary
This is **demo authentication**, not production identity management. The local demo has a fallback development JWT secret to make first-run use possible. Do not deploy with `CLEARPATH_DEMO_AUTH=true` or the fallback secret. For a real deployment, set `CLEARPATH_DEMO_AUTH=false`, configure a long random `CLEARPATH_JWT_SECRET` on the backend only, use HTTPS, use managed email/SMS delivery, add rate limiting and monitoring, and preferably replace this prototype with a managed identity provider. The browser must never receive the JWT signing secret.

The demo-code display is intentionally visible and does not claim to send email or SMS. Account data is stored locally in SQLite. Do not use real personal information.

## Verification performed
- Python syntax compilation: passed.
- FastAPI TestClient suite: 6 tests passed, including mode disclosure, valid demo login/token issuance, registration plus code verification, invalid-password rejection, 401 for unauthenticated source refresh, and 403 for an applicant token attempting an officer/admin action.
- Full frontend TypeScript/Vite build: **not verified**. `npm ci` could not complete because the registry/cache was unavailable; `npm run build` then reported missing installed type packages. Run `npm ci`, `npm run build`, and `npm test -- --run` with registry access before treating this phase as release-ready.
