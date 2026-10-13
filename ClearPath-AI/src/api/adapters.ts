/**
 * Adapters: translate the real FastAPI/PostgreSQL responses (snake_case, bare lists)
 * into the frontend shapes the pages use. Nothing here invents data.
 */
import type {
  AuditEvent,
  Bottleneck,
  Clearance,
  ClearanceStatus,
  DelayStatus,
  DocumentRecord,
  DocumentStatus,
  NotificationItem,
  Project,
  Role,
  User,
  WorkflowDependency,
  WorkflowNode,
} from "@/types";

type Json = Record<string, unknown>;
const str = (v: unknown, d = ""): string =>
  typeof v === "string" ? v : v == null ? d : String(v);
const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const day = (v: unknown): string => str(v).slice(0, 10);
const daysSince = (v: unknown): number => {
  const t = Date.parse(str(v));
  return Number.isFinite(t)
    ? Math.max(0, Math.floor((Date.now() - t) / 86_400_000))
    : 0;
};

export const envelope = <T>(data: T) => ({
  data,
  demo: false,
  source: "Backend",
  generatedAt: new Date().toISOString(),
});

export function toProject(r: Json): Project {
  const status = str(r.status, "draft");
  return {
    ...r,
    id: str(r.project_id ?? r.id),
    name: str(r.project_name ?? r.name),
    code: str(
      r.code,
      `TN-DAIRY-${str(r.project_id ?? r.id)
        .slice(0, 6)
        .toUpperCase()}`,
    ),
    organizationName: str(r.organizationName, ""),
    district: str(r.district),
    capacity_lpd: num(r.capacity_lpd),
    annual_turnover: num(r.annual_turnover),
    stage: str(r.stage, "Planning"),
    readinessScore: num(r.readinessScore) ?? 0,
    status: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
    updatedAt: day(r.updated_at ?? r.updatedAt),
    created_at: str(r.created_at),
    sourceFlag: "Official Reference Data",
    demo: false,
  };
}

/** Frontend wizard Project -> backend ProjectCreate. */
export function fromProject(p: Project): Json {
  return {
    project_name: p.name,
    district: p.district,
    brand_id: /^[0-9a-f-]{36}$/i.test(str(p.brand_id)) ? p.brand_id : null,
    capacity_lpd: p.capacity_lpd ?? null,
    annual_turnover: p.annual_turnover ?? null,
    notes:
      [str(p.organizationName), str(p.activityType)]
        .filter(Boolean)
        .join(" | ") || null,
  };
}

const APP_STATUS: Record<string, ClearanceStatus> = {
  draft: "not_started",
  submitted: "applied",
  under_review: "under_review",
  approved: "approved",
  rejected: "rejected",
  returned: "query_raised",
};
export function toClearance(
  r: Json,
  projectNames: Map<string, string>,
): Clearance {
  const status = APP_STATUS[str(r.status, "draft")] ?? "not_started";
  const pending =
    status === "applied" ||
    status === "under_review" ||
    status === "query_raised";
  const projectId = str(r.project_id);
  return {
    id: str(r.application_id ?? r.id),
    projectId,
    projectName: projectNames.get(projectId) ?? "Project",
    name:
      str(r.application_type, "Application") +
      (r.license_tier ? ` (${str(r.license_tier).replace(/_/g, " ")})` : ""),
    shortCode: str(r.application_type, "APP").slice(0, 12).toUpperCase(),
    department: "FSSAI / Food Safety",
    stage: "Pre-Operation",
    status,
    pendingDays: pending ? daysSince(r.submission_date ?? r.created_at) : 0,
    slaDays: null,
    delayStatus: "timeline_unavailable" as DelayStatus,
    documentReadinessPercent: 0,
    dependencies: [],
    nextAction: nextAction(status),
    ruleCitation: "Timeline unavailable. Confirm with the issuing authority.",
    lastUpdatedDate: day(r.updated_at),
    demo: false,
    source: "Official Reference Data",
  };
}
const nextAction = (s: ClearanceStatus): string =>
  (
    ({
      not_started: "Complete the application and upload required documents.",
      applied: "Wait for departmental review.",
      under_review: "Wait for departmental review.",
      query_raised: "Respond to the reviewer's return comments.",
      approved: "No action needed. Track renewal date.",
      rejected: "Review the rejection reasons and reapply.",
    }) as Partial<Record<ClearanceStatus, string>>
  )[s] ?? "Confirm the next step with the authority.";

const VALIDATION: Record<string, DocumentStatus> = {
  pending: "awaiting_review",
  valid: "validated",
  validated: "validated",
  passed: "validated",
  flagged: "needs_correction",
  invalid: "needs_correction",
  failed: "needs_correction",
  rejected: "rejected",
};
export function toDocument(r: Json, clearance?: Clearance): DocumentRecord {
  const v = str(r.validation_status, "pending").toLowerCase();
  return {
    id: str(r.document_id ?? r.id),
    document_id: str(r.document_id ?? r.id),
    application_id: str(r.application_id ?? clearance?.id),
    clearanceId: clearance?.id,
    clearanceName: clearance?.name,
    projectId: clearance?.projectId,
    projectName: clearance?.projectName,
    documentName: str(r.document_name),
    name: str(r.document_name),
    fileName: str(r.document_name),
    category: str(r.document_type, "General"),
    mandatory: true,
    version: 1,
    status:
      VALIDATION[v] ??
      (str(r.upload_status) === "uploaded" ? "uploaded" : "awaiting_review"),
    file_url: str(r.file_url),
    validationNote:
      "Validation service not connected unless the backend reports a result.",
    demo: false,
    source: "Official Reference Data",
  };
}

export function toNotification(r: Json): NotificationItem {
  const type = str(r.notification_type, "info");
  return {
    ...r,
    id: str(r.notification_id ?? r.id),
    title: str(r.title),
    message: str(r.message),
    type,
    category:
      type === "warning" || type === "error" ? "delay_alert" : "status_changed",
    linkUrl:
      r.related_entity_type === "application"
        ? "/clearances"
        : "/notifications",
    createdAt: str(r.created_at),
    read: Boolean(r.is_read),
  };
}

export function toUser(r: Json): User {
  const active = r.is_active !== false;
  return {
    id: str(r.user_id ?? r.id),
    fullName: str(r.full_name),
    email: str(r.email),
    phone: str(r.phone),
    role: str(r.role, "user") as Role,
    status: active ? "active" : "locked",
    organizationName: "",
    lastLoginAt: str(r.updated_at),
  };
}

export function toAudit(r: Json): AuditEvent {
  return {
    id: str(r.log_id ?? r.id),
    time: str(r.created_at).replace("T", " ").slice(0, 16),
    actor: str(r.actor_id, "system").slice(0, 8),
    action: str(r.action),
    resource: `${str(r.entity_type)} ${str(r.entity_id).slice(0, 8)}`.trim(),
    note: "",
  };
}

export function deriveBottlenecks(cs: Clearance[]): Bottleneck[] {
  return cs
    .filter(
      (c) =>
        c.status === "query_raised" ||
        c.status === "blocked" ||
        c.status === "rejected" ||
        (c.status === "under_review" && c.pendingDays > 30),
    )
    .map((c) => ({
      id: `b-${c.id}`,
      projectId: c.projectId,
      clearanceId: c.id,
      clearanceName: c.name,
      department: c.department,
      pendingDays: c.pendingDays,
      slaDays: null,
      delayDays: null,
      rootCauseType:
        c.status === "query_raised"
          ? "unresolved_query"
          : c.status === "blocked"
            ? "missing_prerequisite"
            : "department_backlog",
      rootCauseDescription:
        c.status === "query_raised"
          ? "The reviewer returned this application with comments."
          : c.status === "rejected"
            ? "The application was rejected."
            : "Pending for a long period. Timeline unavailable.",
      recommendedNextAction: c.nextAction,
    })) as Bottleneck[];
}

export function deriveWorkflow(cs: Clearance[]): {
  nodes: WorkflowNode[];
  dependencies: WorkflowDependency[];
} {
  return {
    nodes: cs.map((c) => ({
      id: c.id,
      label: c.name,
      department: c.department,
      status: c.status,
    })) as WorkflowNode[],
    dependencies: [],
  };
}
