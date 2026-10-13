# ClearPath-TN — Phase 3 Routing and Access Report

## Scope implemented from `SPEC.md`

- Added reusable `ProtectedRoute` and `RoleGuard` components.
- Added a central role policy for `applicant`, `consultant`, `officer`, and `admin`.
- Unauthenticated visits to protected pages redirect to `/login`.
- Expired demo sessions redirect to `/session-expired`. New demo sessions expire after eight hours; legacy local demo sessions without an expiry are migrated once.
- Role violations redirect to `/unauthorized`.
- Implemented missing project summary and activity route handling.
- Added clearance detail route handling and document deep links that open the document inspector.
- Added consultant client detail route handling.
- Unknown paths now show a not-found page instead of silently rendering the dashboard.
- Added role guard tests for unauthenticated access, consultant-only client routes, admin-only user management, and officer/admin review routes.
- Added backend HS256 bearer-token verification and role dependency. The source refresh mutation is restricted to officer/admin roles. Missing backend secret fails closed with HTTP 503; missing/invalid/expired token is rejected; wrong role receives HTTP 403.
- Existing project data, warm-teal visual system, source CSV, API facade, and Phase 2 rule engine are retained.

## Route access policy

- All authenticated roles: dashboard, project list/details/summary/clearances/documents/workflow/bottlenecks/activity/reports, global clearances/documents, reports, notifications, settings, help.
- Applicant and consultant: project creation.
- Applicant, consultant, admin: project editing.
- Consultant only: `/clients` and `/clients/:clientId`.
- Consultant and officer: global `/bottlenecks`.
- Officer and admin: review queue, rules, source registry, audit logs.
- Admin only: user management.
- Public routes: login, registration, recovery/verification screens, account locked, unauthorized, and session expired.

## Security boundary / not yet implemented

- Frontend role guards improve navigation and user experience but are not a substitute for server authorization.
- The backend now has a fail-closed JWT verifier for the protected source-refresh mutation, but this phase does not issue access tokens or implement login/registration. That remains Phase 4. Do not set `CLEARPATH_JWT_SECRET` to a weak value or ship it to the browser.
- The current role switcher and demo login remain simulated prototype controls. They are not real identity verification.
- No pre-expiry warning is shown because the current backend has no session-expiry warning endpoint/contract.

## Verification

- Source files and route list were reviewed against `SPEC.md` Phase 3.
- Python syntax check is run for the backend modules.
- Automated frontend build/tests could not be certified in this environment because `npm ci` did not complete: the package registry request timed out and the local dependency cache lacks required packages. Run `npm ci`, `npm run build`, and `npm test -- --run` on a machine with registry access before treating this phase as release-ready.
