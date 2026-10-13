# TNSWP dashboard snapshot provenance

`tnswp_clearance_dashboard_dataset.csv` contains 36 service rows transcribed from the public Tamil Nadu Single Window Portal dashboard for Fire and Rescue Services Department, Directorate of Industrial Safety and Health, and Tamil Nadu Pollution Control Board.

- Source: https://uat.tnswp.com/DIGIGOV/digigov.htm?actionFlag=loadOnlineSingleWindowPortalDashboard&pagedisp=static
- Retrieval date recorded in the dataset: 2026-10-10
- The page footer reports “Last Updated: 12-08-2025”. This is not proof that the displayed dashboard values were refreshed on the capture date. This is a sourced static snapshot, not a live API feed. Verify the portal before operational decisions.
- Dashboard values expose received, approved, rejected and approval-time statistics. `applications_processed` is derived as approved + rejected, as specified in the project requirements.
- Delay ratios, excess days, severity, bottleneck score and rejection rate are calculated by ClearPath-TN from the displayed source values. They are not official government-issued indicators.
- Dashboard zero values are preserved. Rows with zero received applications include a caution that their approval-time statistics may not represent observed cases.
- No applicant personal data is included. No synthetic or Kaggle records are mixed into the dataset.
