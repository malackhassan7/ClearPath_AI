# ClearPath-TN: real-source mode and data provenance

## What changed
- The application no longer preloads fictional project, clearance, document, notification, audit-event, or rule records.
- The dashboard starts with zero operational records and makes that absence explicit.
- The Sources screen lists public official reference sources and published research; these are links for verification, not a claim of API connectivity.
- The source registry includes the Tamil Nadu Single Window Portal, TNPCB industry forms, TNPCB district committee records, public OCMMS entry points, NSWS and a historical single-window case-study report.
- The TNSWP portal has previously displayed 29,203 applications received and 25,140 approved with a page timestamp of 2 October 2026. This is recorded as a time-sensitive public snapshot, not a live API value. Reopen the source before reusing those numbers.

## Primary source URLs
- Tamil Nadu Single Window Portal: https://tnswp.com/DIGIGOV/swp-tnswp.jsp
- National Single Window System: https://www.nsws.gov.in/
- TNPCB industrial forms: https://tnpcb.gov.in/tamil/applicationforindustry.php
- TNPCB District Level Consent Clearance Committee public records: https://tnpcb.gov.in/dlccc.php
- TNPCB source index / consent orders / reports: https://tnpcb.gov.in/sitemap.php
- National Government Services Portal — TNPCB Consent to Establish service: https://services.india.gov.in/service/detail/apply-for-obtaining-consent-for-establishing-factory-in-tamil-nadu
- Public OCMMS portal: https://ocmms.nic.in/
- PMI/KPMG infrastructure assessment case study: https://static.investindia.gov.in/s3fs-public/2019-09/Infrastructure%20Assessment.pdf
- PRS summary of the Doing Business in India committee report: https://prsindia.org/policy/report-summaries/doing-business-in-india-the-way-forward

## Data limitations
1. No official API, account, credential, or private applicant export has been configured.
2. Public pages may contain aggregate metrics or selected public decisions, but they are not automatically a representative dataset of all applications or processing durations.
3. Do not bypass logins, CAPTCHA, access controls, or portal terms. Do not ingest personal or confidential applicant documents.
4. Do not infer current status, clearance applicability, statutory SLA, or delay predictions from a homepage or selected orders.
5. Before publishing a rule, capture the exact government document, title, section/page, jurisdiction, effective date, retrieval date, and reviewer. Require human approval.
6. Login and role switching are still simulated UI flows. This is not production authentication or server-side RBAC.

## Next engineering work
- Build a FastAPI ingestion service with source allowlists, request throttling, cache, provenance and versioning.
- Add human review before extracted content becomes an active rule.
- Build a data-quality report and mark source failures/staleness visibly.
- Integrate operational application status only after written authorisation or a supported official interface is available.
- Only calculate processing-time statistics when actual, appropriately permissioned event timestamps and a defensible sample are available.
