# ClearPathAI data and UI repair note

## Source checks (11 October 2026)

- District milk production: the original OGD listing is [Time Series Data Details of Milk Production by districts in Tamil Nadu](https://tn.data.gov.in/resource/time-series-data-details-milk-production-districts-tamil-nadu). The publisher page describes 2009-10 to 2018-19 and currently displays `Download: 0`. It is not acceptable to infer intermediate yearly values from only start/end points. The district page therefore shows a transparent unavailable state until the original downloadable records are obtained.
- State-wise milk production: [NDDB statistics](https://www.nddb.coop/information/stats/milkprodstate) is available as a published table. It is a web table/reference, not automatically a live API. An ingestion step still needs to parse the original table/PDF and record retrieval metadata.
- Tamil Nadu Dairy Development Policy Note 2025-26: [official PDF](https://cms.tn.gov.in/cms_migrated/document/docfiles/dairy_e_pn_2025_26.pdf) is the requested source; document parsing and page-level evidence still need to be run locally before displaying extracted claims.
- FSSAI/FoSCoS: use the current official [FoSCoS eligibility page](https://foscos.fssai.gov.in/business-eligibilty) as the current discovery point. The previously specified PDFs should be checked against the current page because the official site publishes revised eligibility PDFs. No old fees/thresholds are hardcoded as verified rules.
- Aavin: original FRO and parlour guideline links remain listed in the brand page, but their values are not shown until parsed and page-cited. Dodla/Hatsun commercial terms remain unavailable until supported by current company-issued documents or written confirmation.

## Code changes

- Frontend defaults to `VITE_USE_MOCK_API=false`. Real API failures no longer silently display mock records.
- Added missing Tailwind directives to `src/styles.css`, which is required for the utility classes used across the UI to render.
- Removed the fabricated district table and interpolated historical chart. The page now discloses source availability.
- Removed hardcoded brand deposits, shop areas, power requirements, and margins from the comparison UI.
- Replaced scheme benefit cards and API fallbacks with official source links only; benefit claims are withheld pending current-document review.
- Cost calculation now refuses to generate a figure until a verified database rule is available; it does not guess default FSSAI fees, brand deposits, or processing costs.
- Removed chatbot offline answers that had asserted specific fees, deposits, district rankings, benefits, and page citations without verified retrieval.
- Project wizard no longer calculates a license tier, fee, or total from embedded threshold constants; it marks the result pending reviewed database rules.
- Business classification and FSSAI rule lookup now fail explicitly when the database has no reviewed records.
- Data migrations 002-004 no longer insert unverified seed rows. Migration 005 removes only known deterministic seed IDs and the known district seed snapshot from an existing database.
- District suitability no longer creates default state-average figures when a district is missing.
- Docker Compose connects the API to the service hostname `db`, waits for database health, and persists PostgreSQL data in a named volume. The unimplemented Celery worker command was removed from Compose.
- Replaced the hand-written initial migration with an initial schema generated from the SQLAlchemy ORM metadata to avoid the existing column-name drift between migrations and models. Existing databases created from the older migration need a fresh, backed-up local volume or a separately planned schema-upgrade migration.

## Not yet done / must be done next

1. Obtain the district dataset from the publisher or an authorised export. If unavailable, keep the module disabled.
2. Parse and validate NDDB/FSSAI/Aavin/TN policy documents with a repeatable ingestion script, file hashes, retrieval timestamps, units, page references and review status.
3. Implement a reviewed, database-only FSSAI rule engine and audited source records.
4. Finish real authentication; disabling mock API is not a substitute for backend login integration.
5. Run Docker Compose, migrations, backend tests, frontend tests, and production build on the target Windows machine.
6. Remove or gate any remaining demo UI content (including navigation demo identities and hardcoded scheme summaries) before claiming a complete real-data application.

**No claim is made that the complete application has been end-to-end tested by this patch.**
