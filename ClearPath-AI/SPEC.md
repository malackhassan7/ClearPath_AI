You are a senior React/TypeScript architect and full-stack product engineer.

I have an existing project named ClearPath-TN.

Tech stack:
- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod
- Recharts
- date-fns
- Axios
- Vitest
- React Testing Library

Project folder:
clearpath-tn

The full specification is attached as SPEC.md. Treat SPEC.md as the source of truth.

The current code is a working visual prototype, but it is approximately 35% complete against SPEC.md. Bring it to full compliance WITHOUT breaking what already works.

==================================================
CURRENT STATE
==================================================

- The entire UI is currently in one file: src/App.tsx, approximately 77 long lines.
- Data is imported directly from src/data/demo.ts.
- There is no real API layer.
- TanStack Query, React Hook Form, Zod, Recharts, date-fns, and Axios are installed but unused.
- Only one test exists.
- There are no loading skeletons.
- There is no password-strength indicator.
- There is no drag-and-drop upload.
- There is no dependency graph.
- There is no reduced-motion CSS.
- There is no proper RoleGuard or ProtectedRoute.
- Missing routes include:
  - /projects/:id/workflow
  - /clearances/:id
  - /documents/:id
  - /admin/rules/:ruleId
  - /clients/:clientId
  - /settings/security
  - /settings/organization
  - /settings/notifications
- The FastAPI backend currently has only /health and /sources endpoints.
- tailwind.config.js and styles.css are fixed and working.
- Preserve the existing warm-teal design system.
- Do not use dark blue as the primary colour.

==================================================
PROJECT DEFINITION
==================================================

PROJECT NAME:
ClearPath-TN

PROJECT TITLE:
ClearPath-TN: Explainable Delay and Bottleneck Analysis System for Industrial Clearances Using Tamil Nadu Single Window Portal Data

PROJECT CASE STUDY:
Delay and Bottleneck Analysis of Fire and Rescue Services, Directorate of Industrial Safety and Health (DISH), and Tamil Nadu Pollution Control Board (TNPCB) industrial clearances in Tamil Nadu.

PRIMARY GOVERNMENT DATA SOURCE:
Tamil Nadu Single Window Portal Dashboard.

Official dashboard URL:
https://uat.tnswp.com/DIGIGOV/digigov.htm?actionFlag=loadOnlineSingleWindowPortalDashboard&pagedisp=static

Official clearance list URL:
https://tnswp.com/DIGIGOV/TN-pages/loc_intermediate.jsp?pagedisp=static

Official TNSWP user manuals URL:
https://tnswp.com/DIGIGOV/TN-pages/user-manual-tnswp.jsp?pagedisp=static

The TNSWP dashboard provides real government-published service-level clearance data, including:
- Department / application name
- Prescribed time limit
- Total applications received
- Total applications processed
- Applications approved
- Applications rejected
- Average time taken to grant approval in days
- Median time taken to grant approval in days
- Minimum time taken to grant approval in days
- Maximum time taken to grant approval in days
- Average fee collected

The dashboard is updated in real time. Therefore, every dataset row must record the exact data-retrieval date.

==================================================
REAL CASE STUDY AND DRAWBACK
==================================================

CASE STUDY:
Industrial clearance delay and bottleneck analysis for the following departments:

1. Fire and Rescue Services Department
   - Focus services:
     - Fire NOC for Non-Multi-Storey Buildings
     - Fire License for Multi-Storey Buildings
     - Other Fire NOC / Fire License services available in the dashboard

2. Directorate of Industrial Safety and Health (DISH)
   - Focus services:
     - Factory registration and licence
     - Factory-plan approval
     - Other DISH services available in the dashboard

3. Tamil Nadu Pollution Control Board (TNPCB)
   - Focus services:
     - Consent to Establish
     - Consent to Operate
     - Other TNPCB services available in the dashboard

DRAWBACK BEING SOLVED:
The Tamil Nadu Single Window Portal already provides dashboards showing department-wise and service-wise clearance statistics, prescribed time limits, applications received, applications processed, approvals, rejections, and average/median/minimum/maximum approval times.

However, the portal does not provide an applicant-level or officer-level decision-support view that automatically:
- Identifies delayed clearances
- Calculates delay severity
- Compares actual approval time with the prescribed time limit
- Ranks services and departments as bottlenecks
- Explains why a clearance is delayed
- Identifies extreme-delay-risk services
- Calculates rejection-rate indicators
- Provides explainable next actions or recommendations
- Converts dashboard statistics into an actionable readiness and bottleneck report

SOLUTION:
ClearPath-TN will convert the official TNSWP dashboard data into an explainable delay, bottleneck, and clearance-risk analysis product.

It will not replace the Tamil Nadu Single Window Portal.
It will not claim to make government approval decisions.
It will not claim legal advice.
It will provide decision-support and explainable analysis using official government-published data.

==================================================
DATASET REQUIREMENT
==================================================

Use only real data from the official TNSWP dashboard.

Create a CSV dataset named:

tnswp_clearance_dashboard_dataset.csv

Use this exact schema:

record_id,department_name,service_name,service_category,prescribed_time_limit_days,applications_received,applications_processed,applications_approved,applications_rejected,average_approval_days,median_approval_days,minimum_approval_days,maximum_approval_days,average_fee_collected,delay_ratio,delay_excess_days,delay_severity,bottleneck_score,rejection_rate_pct,data_source,data_source_url,data_retrieved_on,notes

Column definitions:

record_id: string, unique ID such as TNSWP-0001
department_name: string, exact department name from TNSWP
service_name: string, exact application or clearance name from TNSWP
service_category: string, grouping such as Fire Safety, Industrial Safety, or Pollution Control
prescribed_time_limit_days: integer, official prescribed time limit
applications_received: integer, total applications received
applications_processed: integer, total applications processed
applications_approved: integer, total applications approved
applications_rejected: integer, total applications rejected
average_approval_days: number, average approval time in days
median_approval_days: number, median approval time in days
minimum_approval_days: number, minimum approval time in days
maximum_approval_days: number, maximum approval time in days
average_fee_collected: string, exact fee value shown in dashboard, such as No Fee, 500, 3600, or -
delay_ratio: number, calculated as average_approval_days / prescribed_time_limit_days
delay_excess_days: number, calculated as average_approval_days - prescribed_time_limit_days
delay_severity: string, calculated category
bottleneck_score: number, calculated ranking score
rejection_rate_pct: number, calculated as applications_rejected / applications_received * 100
data_source: string, fixed value: Tamil Nadu Single Window Portal Dashboard
data_source_url: string, official dashboard URL
data_retrieved_on: date, YYYY-MM-DD
notes: string, optional dashboard footnote or special condition

Important:
- Do not create synthetic data.
- Do not invent values.
- Do not estimate missing values.
- If a value is not available, leave it blank and use a clear frontend state such as “Data unavailable” or “Timeline unavailable.”
- Preserve the exact department and service names from the official dashboard.
- Record the retrieval date for every row.
- Do not include applicant names, phone numbers, email addresses, Aadhaar numbers, PAN numbers, application tokens, or any personal data.

The dashboard shows that applications processed equals approved plus rejected. For example, Fire NOC for Non-Multi-Storey Buildings shows 199 applications received, 86 processed, 70 approved, and 16 rejected.

==================================================
RULE ENGINE REQUIREMENT
==================================================

The rule engine must be implemented from PHASE 2 onward, because the real TNSWP dataset becomes available in Phase 2.

The rule engine must not invent legal rules.
It must use only:
1. The official prescribed time limit from the TNSWP dashboard.
2. The official approval-time statistics from the TNSWP dashboard.
3. The official applications received, processed, approved, and rejected values from the TNSWP dashboard.

Implement these exact calculations:

1. Delay ratio:
delay_ratio = average_approval_days / prescribed_time_limit_days

If prescribed_time_limit_days is 0, delay_ratio must be blank.

2. Delay excess:
delay_excess_days = average_approval_days - prescribed_time_limit_days

3. Delay severity:
IF prescribed_time_limit_days = 0 THEN "Timeline unavailable"
ELSE IF average_approval_days <= prescribed_time_limit_days THEN "Within expected time"
ELSE IF delay_ratio <= 2 THEN "Mild delay"
ELSE IF delay_ratio <= 5 THEN "High delay"
ELSE "Critical delay"

4. Bottleneck score:
bottleneck_score = delay_ratio * log(1 + applications_received)

If prescribed_time_limit_days is 0, bottleneck_score must be blank.

5. Rejection rate:
rejection_rate_pct = applications_rejected / applications_received * 100

If applications_received is 0, rejection_rate_pct must be blank.

6. Extreme delay risk:
IF maximum_approval_days > prescribed_time_limit_days * 10
THEN risk_level = "Extreme delay risk"

7. Bottleneck level:
IF delay_ratio <= 1 THEN "No bottleneck"
ELSE IF delay_ratio <= 2 THEN "Low bottleneck"
ELSE IF delay_ratio <= 5 THEN "High bottleneck"
ELSE "Critical bottleneck"

Every calculated result must show:
- The official source
- The official dashboard URL
- The data-retrieval date
- The prescribed time limit
- The actual average approval time
- The calculated delay ratio
- The calculated delay excess
- The delay severity
- The bottleneck level

Example output for Fire NOC for Non-Multi-Storey Buildings:

Clearance: Fire NOC for Non-Multi-Storey Buildings
Department: Fire and Rescue Services Department
Prescribed time: 30 days
Average approval time: 388 days
Median approval time: 31 days
Maximum approval time: 1,082 days
Delay ratio: 12.93
Delay excess: 358 days
Delay severity: Critical delay
Bottleneck level: Critical bottleneck
Risk level: Extreme delay risk
Reason: Average approval time exceeds the prescribed limit by 358 days.
Source: Tamil Nadu Single Window Portal Dashboard
Data retrieved on: 2026-10-10

Do not claim that the rule engine predicts future delays.
Do not claim that it uses machine learning unless a real trained model is implemented.
This is a transparent, explainable, rule-based analysis engine.

==================================================
PRODUCT FEATURES
==================================================

The frontend must support:

1. User authentication and account recovery.
2. Project creation and management.
3. Clearance catalogue based on official TNSWP services.
4. Clearance delay analysis using real TNSWP dashboard data.
5. Delay severity classification.
6. Bottleneck ranking.
7. Department-level bottleneck overview.
8. Service-level delay details.
9. Prescribed time versus actual approval time comparison.
10. Rejection-rate indicator.
11. Extreme-delay-risk identification.
12. Explainable result panels showing source and retrieval date.
13. Workflow timeline for project-level clearance tracking.
14. Dependency view only where official workflow information is available.
15. Reports for delay analysis and bottleneck identification.
16. Notifications for delayed or critical-bottleneck services.
17. Admin/officer views for source registry, rule registry, review queue, users, and audit logs.
18. Settings for profile, security, organization, and notifications.

Do not add unrelated features such as payroll, recruitment, inventory, banking, or generic e-commerce functionality.

==================================================
VISUAL DESIGN RULES
==================================================

Preserve the existing warm-teal design system.

Do not use dark blue as the primary colour.

Use:
- Warm off-white or ivory background
- Graphite or charcoal text
- Muted teal or eucalyptus green for primary actions
- Sage green for approved or successful states
- Soft amber for warning or pending states
- Muted terracotta for errors, rejection, or blocked states
- Warm grey for borders and secondary content
- White or warm-grey cards

Do not use:
- Neon colours
- Excessive gradients
- Generic blue corporate templates
- Flashy animations
- Excessive glassmorphism
- Oversized decorative illustrations
- Colour alone to communicate status

Every status must include:
- Text label
- Icon where appropriate
- Accessible screen-reader label

==================================================
RULES
==================================================

- Work in PHASES.
- After each phase, run:
  npm run build
  npm test
- Fix all errors before starting the next phase.
- Report exactly what changed after each phase.
- Do not start the next phase until the current phase passes.
- Use strict TypeScript.
- Do not use `any`.
- Replace the existing iconMap `any` with a proper typed icon map.
- Remove any dependency that remains unused at the end.
- Never fake live government data.
- Every mock response must include:
  - demo: true
  - source: "Demo data"
  - generatedAt
- Never claim OCR, document validation, export, or live government integration works unless the backend actually returns that result.
- Show “Validation service not connected.” when a validation service is not connected.
- Show “Timeline unavailable.” when no valid timeline exists.
- Keep every currently working screen working at the end of each phase.
- Preserve the existing warm-teal visual design system exactly.
- Do not change the current colour palette, spacing system, typography, or visual identity unless required for accessibility or a missing specified component.

==================================================
PHASE 1 — REFACTOR, NO VISUAL CHANGE
==================================================

Split the current App.tsx into a clean modular structure.

Create:

src/app/
- Router
- Providers
- Query client
- Route configuration

src/components/ui/
- Button
- Input
- Select
- Checkbox
- Dialog
- Tabs
- Table
- Card
- Badge
- Tooltip
- Skeleton
- Toast

src/components/layout/
- AppShell
- Sidebar
- Topbar
- Breadcrumbs
- PageHeader
- MobileNav

src/components/domain/
- StatCard
- StatusBadge
- ClearanceStatusBadge
- PriorityBadge
- DemoDataBadge
- SourceReferenceCard
- EmptyState
- ErrorState
- LoadingSkeleton
- ConfirmDialog
- FormField
- FilterBar
- SearchInput
- Pagination
- AccessibleDataTable
- RoleGuard
- ProtectedRoute

src/features/
- auth
- dashboard
- projects
- clearances
- documents
- workflow
- bottlenecks
- reports
- notifications
- admin
- settings

src/lib/
- API client
- date utilities
- validation utilities
- formatting utilities
- constants

src/types/
- All shared TypeScript interfaces and types

Requirements:
- Do not change the visual appearance.
- Do not change the current behaviour.
- Do not change the warm-teal design system.
- Format code normally.
- No minified long lines.
- Verify the app looks and behaves identically after refactoring.

==================================================
PHASE 2 — REAL DATASET, API, AND RULE ENGINE
==================================================

Create the real dataset foundation and API layer.

1. Create:

src/data/tnswp/tnswp_clearance_dashboard_dataset.csv

Use the exact schema defined above.

Populate it only from the official TNSWP dashboard:
https://uat.tnswp.com/DIGIGOV/digigov.htm?actionFlag=loadOnlineSingleWindowPortalDashboard&pagedisp=static

Start with these departments:
- Fire and Rescue Services Department
- Directorate of Industrial Safety and Health
- Tamil Nadu Pollution Control Board

Include only services actually shown in the official dashboard.

2. Create a typed parser:

src/lib/tnswp.ts

It must:
- Parse the CSV
- Validate required fields
- Convert numeric fields safely
- Calculate delay_ratio
- Calculate delay_excess_days
- Calculate delay_severity
- Calculate bottleneck_score
- Calculate rejection_rate_pct
- Return typed ClearancePerformanceRecord objects
- Handle blank or unavailable values safely
- Never estimate missing values

3. Create:

src/api/
- httpClient.ts
- endpoints.ts
- types.ts
- queryKeys.ts

Define typed interfaces for:
- User
- Organization
- Project
- Clearance
- ClearanceRequirement
- ClearancePerformanceRecord
- DelayAnalysis
- Bottleneck
- WorkflowNode
- WorkflowDependency
- Document
- Notification
- AuditEvent
- RuleSource
- Report
- Pagination
- ApiError

4. Create a typed Axios client:

- Read VITE_API_BASE_URL
- Support typed requests
- Handle API errors safely
- Do not expose tokens in error messages
- Do not log tokens

5. Create a separate mock layer:

src/api/mock/

Use mock mode only when:

VITE_USE_MOCK_API=true

Mock responses must include:
- demo: true
- source: "Demo data"
- generatedAt

However, TNSWP-derived clearance-performance data must not be labelled as “Demo data” if it is loaded from the real CSV dataset. Instead, show:
- source: "Tamil Nadu Single Window Portal Dashboard"
- data_retrieved_on
- official dashboard URL

Only project, user, organization, notification, and workflow records that are not available from the real dataset may use demo mode.

6. Implement TanStack Query hooks:

- useClearancePerformance
- useDelayedClearances
- useBottleneckRanking
- useDepartmentBottlenecks
- useClearanceDetail
- useProjectClearances
- useProjects
- useProject
- useDocuments
- useNotifications
- useAuditEvents
- useRuleSources

Every query must support:
- Loading state
- Empty state
- Error state
- Retry button
- No stack traces in UI

7. Implement the rule engine:

src/lib/ruleEngine.ts

Implement:
- calculateDelayRatio
- calculateDelayExcess
- calculateDelaySeverity
- calculateBottleneckScore
- calculateRejectionRate
- calculateExtremeDelayRisk
- calculateBottleneckLevel
- rankBottlenecks
- explainDelayResult

Every result must include:
- Official source
- Dashboard URL
- Data retrieval date
- Prescribed time limit
- Actual average approval time
- Delay ratio
- Delay excess
- Delay severity
- Bottleneck level
- Explanation

Do not use machine learning in this phase.
Do not predict future delays.
Do not invent clearance rules.
Use only official TNSWP dashboard values and prescribed time limits.

==================================================
PHASE 3 — ROUTING AND ACCESS
==================================================

Implement ProtectedRoute and RoleGuard for:

- applicant
- consultant
- officer
- admin

Add every missing route from SPEC.md section 20.

Required authenticated routes:
- /dashboard
- /projects
- /projects/new
- /projects/:projectId
- /projects/:projectId/edit
- /projects/:projectId/summary
- /projects/:projectId/clearances
- /projects/:projectId/documents
- /projects/:projectId/workflow
- /projects/:projectId/bottlenecks
- /projects/:projectId/activity
- /projects/:projectId/reports
- /clearances
- /clearances/:clearanceId
- /documents
- /documents/:documentId
- /bottlenecks
- /reports
- /notifications
- /settings/profile
- /settings/security
- /settings/organization
- /settings/notifications
- /help

Consultant routes:
- /clients
- /clients/:clientId

Officer/admin routes:
- /admin/review-queue
- /admin/rules
- /admin/rules/:ruleId
- /admin/sources
- /admin/users
- /admin/audit-logs

Public routes:
- /login
- /register
- /forgot-user-id
- /forgot-password
- /reset-password
- /verify-email
- /verify-otp
- /account-locked
- /unauthorized
- /session-expired

Unauthorized users must be redirected to /unauthorized.
Expired sessions must be redirected to /session-expired.
Show a pre-expiry warning when supported by the backend.

==================================================
PHASE 4 — AUTH AND FORMS
==================================================

Rebuild all authentication screens using React Hook Form and Zod.

Required screens:
- Login
- Register
- Forgot user ID
- Forgot password
- Reset password
- Verify email
- Verify OTP
- Account locked

Login must include:
- Email or user ID
- Password
- Show/hide password
- Remember me
- Login button
- Forgot user ID
- Forgot password
- Create account
- Loading state
- Invalid credentials
- Account locked
- Unverified account
- Backend unavailable

Registration must include:
- Full name
- Email
- Mobile number
- Organization name
- Role selection where allowed
- Password
- Confirm password
- Password-strength indicator
- Terms acceptance
- Validation errors
- OTP or email verification step

Forgot user ID and forgot password must:
- Use generic messages to prevent account enumeration
- Not reveal whether an account exists
- Show OTP or email verification state
- Mask sensitive information

Reset password must include:
- New password
- Confirm password
- Password-strength requirements
- Success state
- Return to login

Clearly label authentication as:
“Demo authentication”

Do not pretend emails or OTPs are actually sent when no backend service exists.

Rebuild the four-step project wizard using React Hook Form and Zod.

Step 1: Basic information
- Project name
- Organization
- Applicant contact
- District
- Location or local body
- Project description

Step 2: Business profile
- Industry category
- Industry subcategory
- Enterprise category
- Investment range
- Employee count
- Project stage

Step 3: Site and facility information
- Land status
- Building status
- Built-up area
- Number of floors
- Machinery or process details
- Water requirement
- Electricity requirement
- Boiler indicator only where relevant
- Hazardous-material indicator only where relevant

Step 4: Review and confirmation
- Show all entered data
- Flag missing mandatory fields
- Allow editing
- Require confirmation before submission

==================================================
PHASE 5 — CORE FEATURES
==================================================

Documents:
- Drag-and-drop upload
- Browse file control
- File-type validation
- File-size validation
- Upload progress
- Cancel upload
- Retry upload
- Replace document
- Delete with confirmation
- Privacy warning
- Version number
- Document status
- Query and reply workflow
- Audit history

Do not claim OCR, signature verification, document validation, or legal validation works unless the backend returns that result.

If not connected, display:
“Validation service not connected.”

Clearances:
- Full status set
- Filters by department, service, status, delay severity, and bottleneck level
- Clearance detail page
- Next-action card
- Evidence panel
- Prescribed time versus actual approval time
- Delay ratio
- Delay excess
- Rejection-rate indicator
- Extreme-delay-risk indicator
- Source and retrieval date

Workflow:
- Timeline view
- Dependency graph only where official workflow information is available
- Legend
- Zoom
- Fit to screen
- Reset view
- Accessible list alternative
- Unverified dependencies must display:
“Dependency requires authority confirmation.”

Bottlenecks:
- Ranked bottleneck list using real TNSWP dashboard data
- Department-level bottleneck overview
- Service-level delay details
- Delay ratio
- Delay excess
- Delay severity
- Bottleneck score
- Rejection rate
- Extreme-delay-risk indicator
- Accessible data table behind every chart

Reports:
- Clearance delay report
- Bottleneck report
- Department performance report
- Service performance report
- Project clearance-readiness report
- Export button disabled with explanation when no export service exists

Admin:
- Review queue
- Rule/source registry
- Rule detail page
- Edit dialog with:
  - Reason for change
  - Change summary
  - Version bump
  - Verification warning
- Users
- Audit log with expandable details

Settings:
- Profile
- Security
- Organization
- Notifications

==================================================
PHASE 6 — ACCESSIBILITY AND RESPONSIVE
==================================================

Implement WCAG 2.2 AA practicalities:

- Visible focus states
- Labelled fields
- Errors linked using aria-describedby
- Accessible dialogs
- Accessible tabs
- Accessible tables
- Accessible dropdowns
- Status never communicated by colour alone
- Screen-reader-friendly badges
- Sufficient contrast
- prefers-reduced-motion support
- Mobile drawer navigation with focus trap
- Bottom action bar on mobile
- Card layouts on mobile
- No overflowing tables or charts
- Keyboard navigation
- Accessible charts with data tables

==================================================
PHASE 7 — TESTS
==================================================

Use Vitest, React Testing Library, and user-event.

Create tests for:

- Login validation
- Registration validation
- Forgot user ID flow
- Forgot password flow
- Password reset validation
- Protected routes
- Role-based navigation
- Project wizard validation
- Clearance filtering
- Delay severity calculation
- Bottleneck score calculation
- Delay ratio calculation
- Rejection-rate calculation
- Extreme-delay-risk calculation
- Status badges
- Missing-document display
- Bottleneck display
- Empty states
- Error states
- Responsive navigation
- Form and dialog accessibility

==================================================
PHASE 8 — DOCUMENTATION AND BACKEND CONTRACT
==================================================

Do not implement the FastAPI backend unless explicitly requested.

Update:
- README.md
- .env.example

Create:
BACKEND_INTEGRATION.md

It must clearly list:
- Features currently using the real TNSWP dataset
- Features currently mock-only
- Features requiring backend support
- Required future FastAPI endpoint contracts
- Required request and response TypeScript interfaces
- Role-based authorization requirements
- Data privacy and anonymization requirements
- Features that must not be claimed as live government integration

Backend endpoint contracts must cover:
- Authentication
- Account recovery
- Projects
- Clearances
- Clearance performance
- Delay analysis
- Bottleneck analysis
- Documents
- Workflow dependencies
- Notifications
- Audit events
- Rules and sources
- Reports

Do not create fake backend endpoints.
Do not claim OCR, document validation, export, or government data integration works unless the backend actually returns that result.

==================================================
START INSTRUCTION
==================================================

Start now by stating the implementation plan for PHASE 1 only.

Then implement PHASE 1.

After PHASE 1:
- Run npm run build
- Run npm test
- Fix all errors
- Report exactly what changed
- Confirm that every currently working screen still works
- Wait for approval before starting PHASE 2