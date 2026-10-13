# Phase 1 + 2 report

## Phase 1 (refactor). Was not actually done in the uploaded zip; done now
- `src/App.tsx` (one 92 KB file) is split into `src/app`, `src/components/{ui,layout,domain}`, `src/features/<domain>`, `src/lib`, `src/types`. Code is formatted (Prettier).
- The previous `npm run build` failed with 19 TypeScript errors; all fixed (`lib` is now ES2021, typed `rules`, typed props).
- All `any` removed from app code (`iconMap`, `statusMeta`, page props, notifications, sources).
- Still inline in `app/App.tsx`: Sidebar and Topbar (not yet extracted into their own components), plus Breadcrumbs, ConfirmDialog, FormField, FilterBar, SearchInput, Pagination, AccessibleDataTable, RoleGuard, ProtectedRoute, SourceReferenceCard, PriorityBadge, ClearanceStatusBadge. These come with Phases 3, 5 and 6.

## Phase 2 (API + mock layer)
- `src/types`: User, Organization, Project, Clearance, ClearanceRequirement, DocumentRecord, WorkflowNode, WorkflowDependency, Bottleneck, NotificationItem, AuditEvent, RuleSource, Report, Pagination, ApiError, ApiResponse.
- `src/api/client.ts`: typed Axios client (`VITE_API_BASE_URL`), errors normalised to a safe `ApiError`.
- `src/api/services.ts`: single facade. `src/api/mock/` is used only when `VITE_USE_MOCK_API=true`. Every mock response has `demo:true`, `source:"Demo data"`, `generatedAt`.
- `src/api/hooks.ts`: TanStack Query hooks and mutations. `PageRouter` shows a loading skeleton, an error state with Retry (no stack traces), and pages keep their own empty states.
- Shell shows a "Demo data" badge in mock mode.
- Tests: 6 passing (envelope, persistence, loading, error + retry).

## Behaviour change to be aware of
`.env` now ships with `VITE_USE_MOCK_API=true` (fictional demo records). Set it to `false` to use the backend; the backend currently only has `/health` and `/sources`, so data pages will show the error state until Phase 8.
