import type {
  AuditEvent,
  Clearance,
  DocumentRecord,
  NotificationItem,
  Project,
  RuleSource,
  User,
  Bottleneck,
} from "@/types";

/** Fictional demo records. Nothing here is real government or applicant data. */
export const NOW = () => new Date().toISOString();

const clearance = (
  id: string,
  projectId: string,
  projectName: string,
  name: string,
  shortCode: string,
  department: string,
  status: Clearance["status"],
  pendingDays: number,
  slaDays: number | null,
  docs: number,
  nextAction: string,
  dependencies: string[] = [],
): Clearance => ({
  id,
  projectId,
  projectName,
  name,
  shortCode,
  department,
  stage: "Pre-Establishment",
  status,
  pendingDays,
  slaDays,
  delayStatus:
    slaDays === null
      ? "timeline_unavailable"
      : pendingDays > slaDays
        ? "delayed"
        : pendingDays >= slaDays - 3
          ? "approaching_deadline"
          : "on_time",
  documentReadinessPercent: docs,
  dependencies,
  nextAction,
  ruleCitation:
    "Demo rule sketch. Verify against the current official Act, Order or department guidance.",
  demo: true,
  source: "Demo data",
});

export const seedProjects = (): Project[] => [
  {
    id: "p1",
    name: "Demo Precision Foods Unit",
    code: "DEMO-TN-PRJ-2026-001",
    organizationName: "Demo Precision Foods Pvt. Ltd.",
    district: "Coimbatore",
    industryCategory: "Orange",
    enterpriseCategory: "Small",
    investmentInrLakhs: 450,
    employmentCount: 60,
    stage: "Pre-Construction",
    readinessScore: 58,
    status: "In preparation",
    updatedAt: "2026-10-01",
    sourceFlag: "Demo data",
    demo: true,
  },
  {
    id: "p2",
    name: "Demo Agro Processing Hub",
    code: "DEMO-TN-PRJ-2026-002",
    organizationName: "Demo Agro Processing Hub",
    district: "Salem",
    industryCategory: "Green",
    enterpriseCategory: "Micro",
    investmentInrLakhs: 120,
    employmentCount: 18,
    stage: "Planning",
    readinessScore: 34,
    status: "In preparation",
    updatedAt: "2026-09-24",
    sourceFlag: "Demo data",
    demo: true,
  },
];
export const seedClearances = (): Clearance[] => [
  clearance(
    "c1",
    "p1",
    "Demo Precision Foods Unit",
    "Consent to Establish",
    "DEMO-CTE",
    "TNPCB",
    "query_raised",
    21,
    15,
    70,
    "Respond to the open query on the site layout drawing.",
  ),
  clearance(
    "c2",
    "p1",
    "Demo Precision Foods Unit",
    "Planning permission",
    "DEMO-PLAN",
    "DTCP",
    "under_review",
    12,
    30,
    85,
    "Wait for departmental review.",
  ),
  clearance(
    "c3",
    "p1",
    "Demo Precision Foods Unit",
    "Fire safety recommendation",
    "DEMO-FIRE",
    "Fire & Rescue",
    "not_started",
    0,
    null,
    40,
    "Prepare building plan and fire safety layout.",
    ["c2"],
  ),
  clearance(
    "c4",
    "p1",
    "Demo Precision Foods Unit",
    "Power connection",
    "DEMO-PWR",
    "TANGEDCO",
    "ready_to_apply",
    0,
    20,
    100,
    "Submit the application.",
  ),
  clearance(
    "c5",
    "p1",
    "Demo Precision Foods Unit",
    "Groundwater extraction",
    "DEMO-GW",
    "CGWA",
    "needs_authority_review",
    0,
    null,
    50,
    "Confirm applicability with the authority.",
  ),
  clearance(
    "c6",
    "p2",
    "Demo Agro Processing Hub",
    "Consent to Establish",
    "DEMO-CTE",
    "TNPCB",
    "awaiting_applicant",
    9,
    15,
    45,
    "Upload the corrected land document.",
  ),
  clearance(
    "c7",
    "p2",
    "Demo Agro Processing Hub",
    "Building approval",
    "DEMO-BLD",
    "Local body",
    "applied",
    5,
    30,
    90,
    "No action needed.",
  ),
  clearance(
    "c8",
    "p2",
    "Demo Agro Processing Hub",
    "Food safety licence",
    "DEMO-FSSAI",
    "FSSAI",
    "blocked",
    0,
    null,
    30,
    "Complete the building approval first.",
    ["c7"],
  ),
];
const doc = (
  id: string,
  projectId: string,
  projectName: string,
  documentName: string,
  category: string,
  status: DocumentRecord["status"],
  note: string,
  fileName?: string,
): DocumentRecord => ({
  id,
  projectId,
  projectName,
  documentName,
  category,
  mandatory: true,
  fileName,
  version: fileName ? 1 : 0,
  status,
  validationNote: note,
  demo: true,
  source: "Demo data",
});
export const seedDocuments = (): DocumentRecord[] => [
  doc(
    "d1",
    "p1",
    "Demo Precision Foods Unit",
    "Site layout drawing",
    "Technical / Drawings",
    "needs_correction",
    "Marked by a reviewer in demo data. Validation service not connected.",
    "site-layout-demo.pdf",
  ),
  doc(
    "d2",
    "p1",
    "Demo Precision Foods Unit",
    "Land ownership document",
    "Legal / Land",
    "awaiting_review",
    "Validation service not connected.",
    "land-demo.pdf",
  ),
  doc(
    "d3",
    "p1",
    "Demo Precision Foods Unit",
    "Process flow description",
    "Environmental / Safety",
    "not_uploaded",
    "Not uploaded yet.",
  ),
  doc(
    "d4",
    "p2",
    "Demo Agro Processing Hub",
    "Land ownership document",
    "Legal / Land",
    "needs_correction",
    "Marked by a reviewer in demo data. Validation service not connected.",
    "land-agro-demo.pdf",
  ),
  doc(
    "d5",
    "p2",
    "Demo Agro Processing Hub",
    "Building plan",
    "Technical / Drawings",
    "uploaded",
    "Validation service not connected.",
    "plan-agro-demo.pdf",
  ),
  doc(
    "d6",
    "p2",
    "Demo Agro Processing Hub",
    "Water requirement statement",
    "Environmental / Safety",
    "not_uploaded",
    "Not uploaded yet.",
  ),
];
export const seedRules = (): RuleSource[] => [
  {
    id: "r1",
    name: "Consent to Establish applicability",
    code: "DEMO-R-001",
    category: "Environment",
    logic:
      "Orange or Red category industries are flagged as potentially needing consent before construction.",
    source: "Demo rule sketch, not a legal citation",
    status: "needs_review",
    version: 1,
  },
  {
    id: "r2",
    name: "Fire safety recommendation",
    code: "DEMO-R-002",
    category: "Safety",
    logic:
      "Buildings above a height or occupancy threshold are flagged for fire safety review.",
    source: "Demo rule sketch, not a legal citation",
    status: "needs_review",
    version: 1,
  },
  {
    id: "r3",
    name: "Groundwater extraction",
    code: "DEMO-R-003",
    category: "Water",
    logic:
      "Industries drawing groundwater are flagged for authority confirmation.",
    source: "Demo rule sketch, not a legal citation",
    status: "needs_review",
    version: 1,
  },
];
export const seedUsers = (): User[] => [
  {
    id: "u1",
    fullName: "Arun Kumar",
    email: "arun@demoprecision.example",
    role: "applicant",
    organizationId: "o1",
    organizationName: "Demo Precision Foods Pvt. Ltd.",
    status: "active",
  },
  {
    id: "u2",
    fullName: "Priya Raman",
    email: "priya@clearpath.example",
    role: "consultant",
    organizationId: "o2",
    organizationName: "ClearPath Compliance Partners",
    status: "active",
  },
  {
    id: "u3",
    fullName: "K. Meenakshi",
    email: "meenakshi@tn-review.example",
    role: "officer",
    organizationId: "o3",
    organizationName: "Regulatory Review Desk",
    status: "active",
  },
  {
    id: "u4",
    fullName: "System Administrator",
    email: "admin@clearpath.example",
    role: "admin",
    organizationId: "o4",
    organizationName: "ClearPath-TN Workspace",
    status: "active",
  },
];
export const seedNotifications = (): NotificationItem[] => [
  {
    id: "n1",
    category: "query_raised",
    title: "Query raised on Consent to Establish",
    message: "A demo reviewer asked for a corrected site layout drawing.",
    linkUrl: "/clearances",
    read: false,
    createdAt: "2026-10-08T09:30:00Z",
  },
  {
    id: "n2",
    category: "missing_doc",
    title: "Document missing",
    message: "Process flow description has not been uploaded.",
    linkUrl: "/documents",
    read: false,
    createdAt: "2026-10-07T14:00:00Z",
  },
  {
    id: "n3",
    category: "delay_alert",
    title: "Clearance past its demo timeline",
    message:
      "Consent to Establish has been pending for 21 days against a 15-day demo timeline.",
    linkUrl: "/bottlenecks",
    read: true,
    createdAt: "2026-10-06T08:15:00Z",
  },
];
export const seedAudit = (): AuditEvent[] => [
  {
    id: "a1",
    time: "2026-10-08 09:30",
    actor: "K. Meenakshi",
    action: "Query raised",
    resource: "Site layout drawing",
    note: "Demo event",
  },
  {
    id: "a2",
    time: "2026-10-07 16:05",
    actor: "Arun Kumar",
    action: "Document uploaded",
    resource: "Land ownership document",
    note: "Demo event",
  },
];
export const deriveBottlenecks = (cs: Clearance[]): Bottleneck[] =>
  cs
    .filter(
      (c) =>
        c.delayStatus === "delayed" ||
        c.status === "query_raised" ||
        c.status === "blocked" ||
        c.status === "awaiting_applicant",
    )
    .map((c) => ({
      id: `b-${c.id}`,
      projectId: c.projectId,
      clearanceId: c.id,
      clearanceName: c.name,
      department: c.department,
      pendingDays: c.pendingDays,
      slaDays: c.slaDays,
      delayDays:
        c.slaDays === null ? null : Math.max(0, c.pendingDays - c.slaDays),
      rootCauseType:
        c.status === "blocked"
          ? "missing_prerequisite"
          : c.status === "query_raised"
            ? "unresolved_query"
            : c.status === "awaiting_applicant"
              ? "document_correction_needed"
              : "department_backlog",
      rootCauseDescription:
        c.status === "blocked"
          ? "A prerequisite clearance is not complete."
          : c.status === "query_raised"
            ? "An open query has not been answered."
            : c.status === "awaiting_applicant"
              ? "The applicant needs to supply a correction."
              : "Pending beyond the demo timeline.",
      recommendedNextAction: c.nextAction,
    }));
