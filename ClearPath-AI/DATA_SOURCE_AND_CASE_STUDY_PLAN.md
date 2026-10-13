# ClearPath-TN: Real-data plan (no API or government account access assumed)

## Important boundary

The project currently has no authorised API credentials, private portal access, or government data-sharing agreement. Therefore, it cannot truthfully claim live application-status access. This plan uses public government pages and published research for **reference data**, while keeping private application events out of the system until authorised access is obtained.

## Public sources registered in the application

See `src/data/officialSources.ts` for the typed source registry. It includes Tamil Nadu Single Window Portal, National Single Window System, TNPCB industrial application forms and a primary-source PDF, the National Government Services Portal, TNPCB resource index, an ADB Tamil Nadu MSME/single-window study, PMI/KPMG infrastructure assessment, a PRS committee-report summary, and research on approval risks.

These links have not been turned into automatic scrapers or official legal rules. A link being public does not mean that the site permits automated extraction or provides an API. Check terms, robots/access restrictions, and currentness before scheduling crawls.

## What to build first

1. **Reference source registry:** store title, issuing body, direct URL, document type, publication/effective date, checked-at date, hash, page/section, jurisdiction, reviewer and status.
2. **Human-reviewed ingestion:** download only public material that is permitted; extract PDF/HTML into candidate records; never publish extracted legal rules automatically.
3. **Versioned clearance catalogue:** each clearance and document requirement must have an evidence citation and effective date. Keep applicability as `needs_review` until a domain reviewer confirms it.
4. **Checklist validator:** compare user-entered project facts and the approved checklist; show `missing`, `present`, `not_applicable_pending_review`, or `unknown` with evidence. Do not promise legal compliance.
5. **Operational status:** show `not_connected` until a documented, authorised API or user-provided export is available. Do not scrape behind login, bypass OTP/CAPTCHA, or use a person's portal credentials.
6. **Bottleneck analytics:** use only timestamped records the user is authorised to process. Report sample size, date range, median and 90th percentile, and distinguish observed delays from model estimates.

## Recommended initial pilot

Start with one well-bounded clearance family: TNPCB Consent to Establish / Consent to Operate. Use TNPCB's published industrial forms and instructions as source material. Have a reviewer verify every extracted requirement against current law and applicable board guidance. Expand only after the first checklist has traceable evidence and tests.

## Case-study findings to investigate (not assume as current facts)

- **ADB, 2018 — Tamil Nadu MSME investment climate and institutional reforms:** Tamil Nadu-specific study of policy, institutional and process reforms for single-window clearance. Use it to ground local problem framing, but label it historical.
- **PMI/KPMG infrastructure assessment (2017–18 survey/report):** discusses reported benefits alongside concerns about multi-agency coordination and sector/project-specific approvals. Always include the survey context and date when quoting statistics.
- **Approval Risks in Transportation Infrastructure Projects in India (ASCE conference paper):** discusses coordination, sequential review, planning and timeline issues. Treat as adjacent-sector evidence, not proof about every industrial clearance.
- **PRS summary of “Doing Business in India: The Way Forward”:** policy discussion of fragmented approvals and incomplete single-window rollout. Follow the summary to the underlying committee report before using detailed claims.

## Limitations to overcome

- Fragmented sources and department-specific workflows -> explicit dependency graph and source provenance.
- Requirements can change -> effective-dated, versioned source records and change-review queue.
- Portal dashboard counts are not project-level event data -> don't use them to infer an individual project's status or processing time.
- Public rules may not capture all project-specific exceptions -> return uncertainty and require authority/domain review.
- Historical studies are not live performance data -> label study dates and avoid presenting them as current TN metrics.
- OCR/HTML extraction can be wrong -> page-level citations, human approval and regression tests.
- No API access -> begin with public reference data and manual verified updates; seek written permission or an official integration agreement for live status.

## Proposed tables

- `source_documents(id, title, issuer, url, document_type, published_at, effective_from, effective_to, checked_at, content_hash, jurisdiction, review_status)`
- `clearance_types(id, name, authority, jurisdiction, applicability_notes, status)`
- `requirement_versions(id, clearance_type_id, requirement_text, evidence_source_id, page_or_section, effective_from, effective_to, reviewer_id, review_status)`
- `project_clearance_events(id, project_id, clearance_type_id, event_type, occurred_at, source_system, authorised_basis, evidence_ref)`
- `ingestion_runs(id, source_id, started_at, finished_at, result, error_summary)`

## Definition of done for a real-data MVP

- Every displayed legal requirement has a direct source, version/effective date and review state.
- Unverified requirements are visibly marked and cannot be presented as verified advice.
- The app clearly labels live operational status as unavailable unless a real authorised connector is configured.
- No fictional status or processing-time values appear in a live-data view.
- Source parsing and rule logic have automated tests plus a human-reviewed test set.
- The UI links to the responsible official source and states that the authority makes the final decision.
