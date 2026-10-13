# Backend security and data-integrity fixes

Verified here: 40 backend tests (no database needed), 31 frontend tests, `tsc` 0 errors, production build OK.
Each fix below has a test that fails if the old bug is put back (checked by re-introducing every bug once).
NOT verified here: anything that needs PostgreSQL/Docker (see "Run this first" and "Still open").

## Fixed
| # | Problem | Fix |
|---|---------|-----|
| 1 | `/auth/register` accepted `role: "admin"` or `"officer"` from the request body | Registration allows only user, farmer, entrepreneur, consultant (422 otherwise). Officers/admins are created by an admin (`POST /admin/users`, `PUT /admin/users/{id}/role`, audit-logged, cannot change/lock your own account) or by `scripts/create_admin.py`. Register form no longer offers them. |
| 2 | `/admin/users`, `/admin/audit-logs`, `/notifications`, `/grievances`, chatbot conversations returned raw database rows (password hashes, IP addresses, user agents) | Every such route has an explicit response schema. Test fails if `password_hash`/`ip_address` ever appears, and a route audit fails if any non-allowlisted route has no response schema. |
| 3 | `POST /rule-engine/validate-document/{id}` needed no login | Route removed (duplicate). All rule-engine routes now require login. |
| 4 | Any logged-in user could list/create applications in someone else's project, and validate / read flags of someone else's document | Owner/officer/admin checks added (`_project_for_user`, `_document_for_user`). A route audit fails if any non-public route lacks a login requirement. |
| 5 | Any logged-in user could create brands | Admin only. |
| 6 | `.env` with real-looking keys shipped in the zip; a known placeholder JWT secret was accepted | `.env` removed; startup refuses a placeholder/short secret unless `APP_ENV=development`, where a random per-run secret is used. Legacy second auth system and its `auth.sqlite3` (4 demo users) deleted. CORS no longer falls back to `*`. |
| 7 | Invented FSSAI fees (₹7,500/3,000/2,000/100) and a fake "last verified 2024-01-01" returned whenever no rule row existed | Rules come only from `fssai_rules` rows (capacity/turnover ranges, highest matching tier). No row = HTTP 503, never a guess. Rule status and verification date are returned as stored. Hard-coded checklist items are tagged `needs_verification`. |
| 8 | "Validation" checked made-up text/size, returned a sample "Murugan K, Namakkal" result for unknown ids, crashed on real documents (missing columns) and tried a Celery worker that does not exist | Real structural checks only (type, size) from stored metadata; unknown id = 404; the result states what was and was not checked ("content not checked: no OCR connected"); status stays `pending`, never `passed`. |
| 9 | `/health` said "database: configured" without checking | Runs `SELECT 1`; returns 503 when the database is down. |
| 10 | 4 failing backend tests asserted the invented values | Replaced with tests of the honest behaviour (503 without data). |

## Run this first (needs Docker; I could not run it)
1. **Rotate** the JWT secret and the three API keys that were in the old `backend/.env`.
2. `cd backend && cp .env.example .env`, set `JWT_SECRET_KEY` (see comment in the file) and your API keys.
3. `docker compose up -d --build`
4. Create the first admin: `docker compose exec api python scripts/create_admin.py --email you@example.com --name "Your Name"`
5. **Check existing accounts**, because anyone could self-register as admin before this fix:
   `docker compose exec db psql -U dairysetu -d dairysetu_tn -c "select email, role from users where role in ('admin','officer');"`
   and demote/deactivate any you do not recognise.

## Still open (not done in this round)
- Login rate limiting / lockout; refresh-token rotation and server-side logout (tokens are still stateless).
- Audit log only covers officer reviews, user/role changes and admin-created users; uploads, deletes, project and status changes are not yet audited. Nothing creates notifications yet.
- Officers can still move an application between any two statuses (no transition rules).
- Reference tables (fssai_rules, business_types, required documents, brand requirements, districts, schemes, RAG chunks) are still empty: calculators return 503 until source-backed data is loaded.
- Migration 001 is `create_all` of the current models, not a true migration history; no tests against a real PostgreSQL; Redis is unused; no OCR/validation worker; no document query/reply tables, rules registry, renewals or clearance dependencies.
- The `Demo@12345` default password is still pre-filled on the login/register forms (frontend).
