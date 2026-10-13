# ClearPath-TN Implementation Plan

**Project Title:** ClearPath-TN: Explainable Industrial Clearance Readiness, Document Validation, and Workflow Bottleneck Detection System Using Tamil Nadu Single Window Portal Data  
**Application Type:** Production-grade Enterprise React + TypeScript Application (Academic Decision-Support & Compliance Platform)

---

## 1. Product Architecture & System Overview

ClearPath-TN acts as an intelligent decision-support and workflow explanation layer adjacent to the Tamil Nadu Single Window Portal (TNSWP). It is designed to assist MSMEs, large industrial applicants, compliance consultants, and authorized regulatory review officers in determining clearance readiness, detecting bottlenecks, managing document requirements, and auditing timeline delays with explainable rule citations.

```mermaid
graph TD
    subgraph Client Layer [Frontend Client Layer - React + Vite + TS]
        Router[React Router v6]
        AuthCtx[Auth & RBAC Context]
        ThemeCtx[Design System & Tokens]
        QueryClient[TanStack React Query Cache]
        
        subgraph Presentation Components
            Shell[App Shell & Nav]
            DashboardComp[Role-Aware Dashboards]
            WizardComp[4-Step Project Wizard]
            ClearanceComp[Clearance Tracker & Explainer]
            DocComp[Document Vault & Query Manager]
            WorkflowComp[Timeline & Dependency Graph]
            BottleneckComp[Bottleneck & Delay Analytics]
            ReportComp[Report Generator & Preview]
            AdminComp[Rule/Source Registry & Audit Logs]
        end

        subgraph Service & Data Access Layer
            APIService[Typed API Client / Axios]
            MockAdapter[Isolated Mock Data Provider (Demo Flagged)]
            DataMappers[Safe Transformation & Validation (Zod)]
        end
    end

    subgraph Future Backend Target [FastAPI REST / Python Engine]
        FastAPIRoutes[/api/v1/* Endpoints]
        RuleEngine[Explainable Rule & Dependency Engine]
        DocValidator[Document Metadata & OCR Verification]
        AuditService[Append-Only Audit Ledger]
    end

    Router --> AuthCtx
    AuthCtx --> Shell
    Shell --> DashboardComp
    Shell --> WizardComp
    Shell --> ClearanceComp
    Shell --> DocComp
    Shell --> WorkflowComp
    Shell --> BottleneckComp
    Shell --> ReportComp
    Shell --> AdminComp

    DashboardComp --> QueryClient
    ClearanceComp --> QueryClient
    DocComp --> QueryClient
    WorkflowComp --> QueryClient
    BottleneckComp --> QueryClient
    AdminComp --> QueryClient

    QueryClient --> APIService
    APIService -->|VITE_USE_MOCK_API=true| MockAdapter
    APIService -->|VITE_USE_MOCK_API=false| FastAPIRoutes
```

---

## 2. Final Route Map

### A. Public & Authentication Routes
| Route | Access | Purpose |
| :--- | :--- | :--- |
| `/login` | Public | Dual identifier (Email/User ID) login, demo quick-login switcher, loading/lockout states |
| `/register` | Public | Account creation with role selection (Applicant / Consultant), password strength, terms |
| `/forgot-user-id` | Public | Account-enumeration-safe User ID recovery via email or mobile OTP step |
| `/forgot-password` | Public | Secure password reset dispatch with generic confirmation message |
| `/reset-password` | Public | Token/OTP verified new password configuration |
| `/verify-email` | Public | Email activation verification state with resend options |
| `/verify-otp` | Public | 6-digit OTP verification screen with countdown and resend |
| `/account-locked` | Public | Informational screen when threshold failed attempts occur with support contact |
| `/session-expired` | Public | Inactivity/token expiry notification with seamless re-authentication redirect |
| `/unauthorized` | Public / Authenticated | 403 Forbidden state when user lacks sufficient RBAC privileges |

### B. Core Authenticated Workspace Routes
| Route | Role Access | Purpose |
| :--- | :--- | :--- |
| `/dashboard` | All (Role-Tailored) | Adaptive dashboard: Applicant (Project health & next actions), Consultant (Portfolio & Client status), Officer (Workload & Review queues) |
| `/projects` | All | Searchable, filterable enterprise data table of industrial projects with stage badges & stats |
| `/projects/new` | Applicant, Consultant | 4-step wizard for project creation with dynamic business, facility & machinery inputs |
| `/projects/:projectId` | All | Comprehensive project overview, readiness meter, warnings, and tabbed workflow hub |
| `/projects/:projectId/edit` | Applicant, Consultant, Admin | Edit project parameters and facility attributes |
| `/projects/:projectId/clearances`| All | Clearance matrix for specific project with department responsibilities and pending days |
| `/projects/:projectId/documents` | All | Project document repository with status tags, query responses, and replacement flow |
| `/projects/:projectId/workflow` | All | Interactive dual view: Stage Timeline + SVG Dependency Graph with fallback list |
| `/projects/:projectId/bottlenecks`| All | Project-specific bottleneck diagnostics, longest pending items, and mitigation actions |
| `/projects/:projectId/reports` | All | On-demand project readiness and missing-document report builder & print/preview |
| `/clearances` | All | Global clearance registry across all accessible projects with status & department filters |
| `/clearances/:clearanceId` | All | Detailed single-clearance view with rule citations, query log, timeline & next actions |
| `/documents` | All | Global document center for cross-project document tracking, verification & queries |
| `/documents/:documentId` | All | Document inspection drawer/view with version history, query thread, and audit log |
| `/bottlenecks` | Consultant, Officer | Global bottleneck detection, department processing latency distributions, and SLA alarms |
| `/reports` | All | Global report center for compliance readiness, SLA adherence, and audit summaries |
| `/notifications` | All | Categorized notification feed (queries, delays, approvals, security) with mark-as-read |
| `/help` | All | TNSWP workflow reference, user manual, disclaimer statement, and FAQ |

### C. Consultant-Specific Routes
| Route | Role Access | Purpose |
| :--- | :--- | :--- |
| `/clients` | Consultant | Client directory with multiple enterprise organizations, project counts & readiness |
| `/clients/:clientId` | Consultant | Deep client profile with aggregate clearances, risk indicators & assigned team notes |

### D. Authorized Officer / Administrator Routes
| Route | Role Access | Purpose |
| :--- | :--- | :--- |
| `/admin/review-queue` | Officer, Admin | Incoming project submissions & clearance applications awaiting regulatory review |
| `/admin/rules` | Officer, Admin | Explainable clearance rule repository with condition logic and citation mappings |
| `/admin/rules/:ruleId` | Officer, Admin | Rule inspection, condition logic view, version history, and verified source linkage |
| `/admin/sources` | Officer, Admin | Official source registry (Acts, Government Orders, TNSWP Gazette notifications) |
| `/admin/users` | Admin | User & role management, organization assignments, and account status toggles |
| `/admin/audit-logs` | Admin, Officer | Tamper-evident chronological audit ledger of all system transactions and status updates |

### E. User & Organization Settings Routes
| Route | Role Access | Purpose |
| :--- | :--- | :--- |
| `/settings/profile` | All | Personal profile, contact details, role metadata, and avatar initials |
| `/settings/security` | All | Password updates, demo session controls, and MFA/2FA configuration readiness |
| `/settings/organization` | All | Enterprise profile, industry category, district, and authorized representative list |
| `/settings/notifications`| All | In-app and notification channel preferences and frequency controls |

---

## 3. User-Role Permissions Matrix

| Feature / Domain | Applicant | Compliance Consultant | Authorized Officer | Administrator |
| :--- | :---: | :---: | :---: | :---: |
| **Create & Edit Own Projects** | ✅ | ✅ (For assigned clients) | ❌ (Review only) | ✅ (System-wide) |
| **Upload / Replace Documents** | ✅ | ✅ | ❌ | ❌ |
| **Respond to Document Queries** | ✅ | ✅ | ❌ | ❌ |
| **Raise Official Document Query**| ❌ | ❌ | ✅ | ✅ |
| **Update Clearance Status** | ❌ (View only) | ❌ (View only) | ✅ (Under review/Approve/Reject) | ✅ |
| **View Explainable Source Rules**| ✅ (Read-only) | ✅ (Read-only) | ✅ (Read-only) | ✅ (Manage with audit note) |
| **Access Client Portfolio Hub** | ❌ | ✅ | ❌ | ❌ |
| **Review Queue Access** | ❌ | ❌ | ✅ | ✅ |
| **User & Organization Admin** | ❌ | ❌ | ❌ | ✅ |
| **View Audit Logs** | ❌ (Project audit only)| ❌ (Project audit only)| ✅ | ✅ |
| **Generate & Print Reports** | ✅ | ✅ | ✅ | ✅ |

---

## 4. Typed Data Models

The application strictly defines TypeScript interfaces and Zod schemas:

1. **`User`**: `id`, `fullName`, `email`, `mobile`, `role` (`'applicant' | 'consultant' | 'officer' | 'admin'`), `organizationId`, `organizationName`, `avatarUrl?`, `status`, `lastLoginAt`.
2. **`Organization`**: `id`, `name`, `type` (`'MSME' | 'Large Enterprise' | 'Consultancy' | 'Department'`), `district`, `registrationNumber`, `address`, `contactEmail`, `contactPhone`.
3. **`Project`**: `id`, `name`, `code` (e.g. `DEMO-PRJ-001`), `organizationId`, `organizationName`, `district`, `locationBody`, `industryCategory` (`'Green' | 'Orange' | 'Red' | 'White'`), `industrySubcategory`, `enterpriseCategory` (`'Micro' | 'Small' | 'Medium' | 'Large'`), `investmentInrLakhs`, `employmentCount`, `stage` (`'Planning' | 'Pre-Construction' | 'Pre-Operation' | 'Operational'`), `landStatus`, `builtUpAreaSqFt`, `hazardousMaterials`, `boilerRequired`, `waterRequirementKld`, `powerRequirementKva`, `readinessScore`, `status`, `createdAt`, `updatedAt`, `sourceFlag: "Demo data"`.
4. **`Clearance`**: `id`, `projectId`, `projectName`, `name`, `shortCode` (e.g., `TN-PCB-CTO`), `department` (e.g., `TNPCB`, `DTCP`, `Fire & Rescue`, `DISSH`, `TANGEDCO`, `CGWA`), `stage` (`'Pre-Establishment' | 'Pre-Operation'`), `status` (`'not_started' | 'potentially_applicable' | 'ready_to_apply' | 'applied' | 'under_review' | 'query_raised' | 'awaiting_applicant' | 'approved' | 'rejected' | 'blocked' | 'needs_authority_review' | 'not_applicable'`), `appliedDate?`, `lastUpdatedDate`, `pendingDays`, `slaDays`, `delayStatus` (`'on_time' | 'approaching_deadline' | 'delayed' | 'timeline_unavailable'`), `responsibleOfficer?`, `responsibleDepartment`, `documentReadinessPercent`, `ruleReferenceId?`, `ruleCitation?`, `dependencies`: `string[]`, `blockingClearanceIds`: `string[]`, `nextAction`: `NextAction`, `sourceFlag: "Demo data"`.
5. **`ClearanceRequirement` & `Document`**: `id`, `projectId`, `clearanceId?`, `documentName`, `category` (`'Legal / Land' | 'Technical / Drawings' | 'Environmental / Safety' | 'Financial / Identity'`), `mandatory`, `fileUrl?`, `fileName?`, `fileSizeBytes?`, `fileFormat?`, `version`, `uploadedAt?`, `status` (`'not_uploaded' | 'uploaded' | 'processing' | 'validated' | 'needs_correction' | 'rejected' | 'expired' | 'awaiting_review'`), `validationChecks`: `{ filePresent: boolean; formatValid: boolean; readable: boolean; metadataComplete: boolean; validationNote?: string }`, `queries`: `DocumentQuery[]`, `auditHistory`: `DocumentAuditEntry[]`.
6. **`DocumentQuery`**: `id`, `documentId`, `raisedByOfficerName`, `raisedAt`, `queryText`, `status` (`'open' | 'responded' | 'resolved'`), `applicantResponse?`, `respondedAt?`, `supportingDocumentUrl?`.
7. **`WorkflowNode` & `WorkflowDependency`**: `sourceId`, `targetId`, `dependencyType` (`'prerequisite' | 'parallel_allowed' | 'document_gating'`), `reason`, `sourceReference`, `verificationStatus` (`'verified' | 'requires_authority_confirmation'`).
8. **`Bottleneck`**: `id`, `projectId`, `projectName`, `clearanceId`, `clearanceName`, `department`, `stage`, `pendingDays`, `slaDays`, `delayDays`, `delayStatus`, `rootCauseType` (`'unresolved_query' | 'missing_prerequisite' | 'department_backlog' | 'document_correction_needed'`), `rootCauseDescription`, `pendingWith`, `recommendedNextAction`, `evidenceStatus`.
9. **`RuleSource`**: `id`, `ruleName`, `ruleCode`, `applicableCategory`, `conditionLogic`, `resultRequirement`, `sourceDocumentTitle`, `sourceUrl`, `gazetteSection`, `effectiveDate`, `lastVerifiedDate`, `status` (`'verified' | 'needs_review' | 'superseded' | 'disabled'`), `version`, `updatedBy`.
10. **`AuditEvent`**: `id`, `timestamp`, `actorName`, `actorRole`, `action`, `resourceType`, `resourceId`, `previousState?`, `newState?`, `ipAddressMasked`, `details`.
11. **`NotificationItem`**: `id`, `userId`, `category` (`'missing_doc' | 'query_raised' | 'query_response' | 'status_changed' | 'approved' | 'rejected' | 'delay_alert' | 'rule_update' | 'security'`), `title`, `message`, `linkUrl`, `read`, `createdAt`.
12. **`ApiResponse<T>` & `ApiError`**: Standard envelope with `data`, `demo: boolean`, `source: "Demo data"`, `generatedAt: string`, `pagination?`.

---

## 5. Visual Design System & UI Specifications

- **Default Theme:** Warm Ivory & Off-White Enterprise Workspace.
- **Palette Tokens:**
  - `--background`: `#FBFBF9` (Warm Ivory)
  - `--card`: `#FFFFFF` & `#F5F4F0` (Crisp & warm-grey elevated surfaces)
  - `--foreground`: `#1F2421` (Deep Graphite / Charcoal for high contrast readability)
  - `--primary`: `#2D6A4F` / `#1B4D3E` (Muted Eucalyptus / Teal for actions and primary navigation)
  - `--primary-foreground`: `#FFFFFF`
  - `--success`: `#386641` (Sage Green for approved/complete)
  - `--warning`: `#D97706` / `#B45309` (Amber for pending/queries)
  - `--danger`: `#BC4749` / `#9E2A2B` (Muted Terracotta for blocked/rejected/overdue)
  - `--info`: `#6B7280` / `#5E6472` (Lavender-Slate for neutral informational items)
  - `--border`: `#E5E4DE` (Soft warm-grey borders)
  - `--muted`: `#6C757D`
- **Accessibility (WCAG 2.2 AA):**
  - Text-to-background contrast $\ge 4.5:1$ (body) and $\ge 3:1$ (large text).
  - Dual status encoding: Every status badge renders an explicit icon + descriptive text label + aria-label (never color alone).
  - Accessible interactive modals with focus trap, ARIA role `dialog`, and keyboard escape listeners.
  - Tab navigation with `aria-selected` and arrow-key cycling.
  - Accessible data table alternatives for all Recharts visualizations.
  - High-contrast mode toggle in user settings.

---

## 6. Mock Data Boundaries & Safe Disclaimers

- **Environment Flags:**
  - `VITE_API_BASE_URL` (Defaults to `/api/v1` or configured URL)
  - `VITE_USE_MOCK_API=true` (Activates local typed mock adapter)
- **Fictionalized Demo Data Rules:**
  - Every demo record explicitly contains `demo: true` and `source: "Demo data"`.
  - Visible `Demo data (Simulated TNSWP Schema)` badge prominently rendered in the global App Shell.
  - Fictional enterprise entities: *"Demo Precision Foods Pvt. Ltd."*, *"Demo Agro Processing Hub"*, *"DEMO-TN-PRJ-2026-001"*.
  - Strict privacy warnings: Notice banners prohibiting upload of real Aadhaar, PAN, bank passbooks, or personal identifiable documents.
  - Safe sample files for document demonstration with zero external upload risks.
  - Clear academic disclaimers: *"Academic decision-support prototype. Not officially affiliated with Tamil Nadu Government portals. Clearances must be confirmed with respective departments."*

---

## 7. Future Backend Integration Points (FastAPI Preparation)

The frontend architecture uses a clean service facade (`src/services/api/`):
- `authService.ts`: `/api/v1/auth/login`, `/register`, `/recovery`, `/otp`
- `projectService.ts`: `/api/v1/projects` (CRUD, filtering, creation wizard)
- `clearanceService.ts`: `/api/v1/projects/{id}/clearances`, `/clearances/{id}`
- `documentService.ts`: `/api/v1/documents`, `/documents/{id}/upload`, `/documents/{id}/queries`
- `workflowService.ts`: `/api/v1/projects/{id}/workflow` (Nodes & dependencies DAG)
- `bottleneckService.ts`: `/api/v1/bottlenecks` (SLA calculations & root cause analytics)
- `reportService.ts`: `/api/v1/reports/generate`, `/reports/preview`
- `adminService.ts`: `/api/v1/admin/rules`, `/sources`, `/users`, `/audit-logs`

Switching from mock to live backend requires only toggling `VITE_USE_MOCK_API=false` in `.env`.

---

## 8. Testing Strategy

Using **Vitest** + **React Testing Library** + **@testing-library/user-event**:
1. **Authentication & Recovery Unit/Integration Tests:**
   - Login form validation, role-based login simulation, error banner rendering.
   - Registration password strength requirements and field validation.
   - Forgot User ID and Forgot Password generic recovery flows (preventing account enumeration).
2. **Role-Based Access Control (RBAC) Tests:**
   - Protected route verification for unauthenticated users.
   - RoleGuard ensuring Applicants cannot access `/admin/*` or `/clients/*`.
   - Officer and Consultant role-specific UI rendering.
3. **Project & Clearance Workflow Tests:**
   - 4-step project creation wizard validation and step progression.
   - Clearance matrix filtering by status and department.
   - Status badge rendering with accessible labels and icons.
4. **Document & Query Management Tests:**
   - File size/type validation simulation.
   - Query raising by officer and reply flow with audit history.
5. **Bottleneck & Explainability Tests:**
   - Bottleneck detection calculation and "Timeline unavailable" fallback handling.
   - Source reference card rendering verified Gazette citation.
6. **Edge, Error & Empty State Tests:**
   - Skeleton loading states.
   - Network failure error boundary and retry interactions.
   - Empty state rendering with actionable CTA.

---

## Verification Plan

### Automated Tests
- Execute Vitest suite: `npm test -- --run`
- Execute TypeScript check: `npx tsc --noEmit`
- Execute Vite build: `npm run build`

### Manual End-to-End Verification
- Test all 10 authentication & recovery routes (`/login`, `/register`, `/forgot-user-id`, `/forgot-password`, `/reset-password`, `/verify-otp`, `/account-locked`, `/session-expired`, `/unauthorized`, etc.).
- Switch between 3 user roles (Applicant, Consultant, Authorized Officer) using the quick-role switcher in the shell.
- Create a new project via the 4-step wizard, inspect generated clearances, missing documents, and SVG dependency graph.
- Test document query thread, bottleneck dashboard, report generator, rule registry, audit logs, and settings.
- Verify responsive layout across Desktop (1280px+), Tablet (768px-1024px), and Mobile (<768px drawer navigation).
