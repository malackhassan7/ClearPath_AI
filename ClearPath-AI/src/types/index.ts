/**
 * ClearPathAI Platform Type Definitions
 * Unified digital ecosystem for Tamil Nadu dairy compliance, market intelligence, and traceability.
 */

export type Role = "user" | "officer" | "admin" | "farmer" | "entrepreneur" | "consultant" | "applicant";
export type Language = "en" | "ta";
export type DemoFlag = "Official Reference Data" | "Demo data";

export interface User {
  id: string;
  user_id?: string;
  fullName: string;
  full_name?: string;
  email: string;
  mobile?: string;
  phone?: string;
  role: Role;
  organizationId?: string;
  organizationName?: string;
  preferred_language?: Language;
  status?: "active" | "locked" | "pending";
  is_active?: boolean;
  lastLoginAt?: string;
  created_at?: string;
}

export interface Organization {
  id: string;
  org_id?: string;
  name: string;
  org_name?: string;
  type: "dairy_brand" | "retailer" | "distributor" | "chilling_centre" | "processing_unit" | "collection_centre" | "consultant" | "MSME" | "Large Enterprise" | "Consultancy" | "Department";
  org_type?: string;
  district: string;
  fssai_license_no?: string;
  registrationNumber?: string;
  contactEmail?: string;
}

export interface Brand {
  brand_id: string;
  brand_name: string;
  brand_type: "cooperative" | "private" | "independent";
  headquarters?: string;
  website_url?: string;
  is_active: boolean;
  deposit_parlour?: number;
  deposit_fro?: number;
  rule_status?: "verified" | "unverified";
}

export interface BusinessType {
  business_type_id: string;
  type_name: string;
  type_code?: string;
  display_name: string;
  description?: string;
}

export interface FSSAIRule {
  rule_id: string;
  license_tier: "registration" | "state_license" | "central_license";
  min_capacity_lpd?: number;
  max_capacity_lpd?: number;
  min_turnover?: number;
  fee_per_year: number;
  form_type: string;
  source_url: string;
  effective_date: string;
  last_verified_on: string;
}

export interface DocumentChecklistItem {
  document_name: string;
  is_mandatory: boolean;
  template_url?: string;
  description?: string;
  source_url?: string;
  source: "fssai" | "brand" | "aavin";
}

export interface CostBreakdown {
  fssai_fee: number;
  brand_deposit?: number;
  other_fees?: number;
  total: number;
  currency: "INR";
  notes?: string;
}

export interface DistrictSuitability {
  district: string;
  production_2018_19: number;
  growth_rate_percent: number;
  suitability_tier: "A" | "B" | "C" | "D";
  suitability_score: number;
  data_source: string;
  retrieved_on?: string;
}

export type ApplicationStatus =
  | "draft"
  | "ready_for_review"
  | "under_review"
  | "attention_needed"
  | "approved"
  | "rejected"
  | "withdrawn";

export interface Application {
  application_id: string;
  project_id: string;
  application_type: string;
  license_tier: string;
  fee_amount?: number;
  status: ApplicationStatus;
  applied_date?: string;
  created_at: string;
}

export interface Project {
  id: string;
  project_id?: string;
  name: string;
  project_name?: string;
  code?: string;
  organizationName?: string;
  district: string;
  industryCategory?: "Green" | "Orange" | "Red" | "White" | string;
  enterpriseCategory?: "Micro" | "Small" | "Medium" | "Large" | string;
  investmentInrLakhs?: number;
  employmentCount?: number;
  capacity_lpd?: number;
  annual_turnover?: number;
  brand_id?: string;
  business_type_id?: string;
  stage?: "Planning" | "Pre-Construction" | "Pre-Operation" | "Operational" | string;
  project_stage?: string;
  readinessScore?: number;
  status: string;
  updatedAt?: string;
  created_at?: string;
  sourceFlag?: DemoFlag;
  demo?: boolean;
  [extra: string]: unknown;
}

export type ClearanceStatus =
  | "not_started"
  | "potentially_applicable"
  | "ready_to_apply"
  | "applied"
  | "under_review"
  | "query_raised"
  | "awaiting_applicant"
  | "approved"
  | "rejected"
  | "blocked"
  | "needs_authority_review"
  | "not_applicable";

export type DelayStatus =
  | "on_time"
  | "approaching_deadline"
  | "delayed"
  | "timeline_unavailable";

export interface Clearance {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  shortCode: string;
  department: string;
  stage: string;
  status: ClearanceStatus;
  pendingDays: number;
  slaDays: number | null;
  delayStatus: DelayStatus;
  documentReadinessPercent: number;
  dependencies: string[];
  nextAction: string;
  ruleCitation: string;
  lastUpdatedDate?: string;
  demo?: boolean;
  source?: DemoFlag;
}

export type DocumentStatus =
  | "not_uploaded"
  | "uploaded"
  | "processing"
  | "needs_review"
  | "needs_correction"
  | "awaiting_review"
  | "verified"
  | "validated"
  | "rejected";

export interface AppDocument {
  id: string;
  document_id?: string;
  clearanceId?: string;
  application_id?: string;
  clearanceName?: string;
  name?: string;
  document_name?: string;
  documentName?: string;
  fileName?: string;
  projectId?: string;
  projectName?: string;
  mandatory?: boolean;
  version?: string | number;
  category?: string;
  status: DocumentStatus;
  uploadedAt?: string;
  fileSize?: string;
  file_size_kb?: number;
  fileType?: string;
  file_format?: string;
  sourceUrl?: string;
  file_url?: string;
  flags?: DocumentFlag[];
  validationNotes?: string;
  validationNote?: string;
  demo?: boolean;
  source?: string;
}

export interface DocumentFlag {
  id?: string;
  flag_id?: string;
  document_id?: string;
  type?: string;
  flag_type: string;
  severity: "info" | "warning" | "error";
  flag_severity?: "info" | "warning" | "error";
  message: string;
  flag_message?: string;
  auto_detected?: boolean;
  resolved?: boolean;
}

export interface ChatSource {
  document_title: string;
  page_number?: number;
  source_url: string;
  source_org?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp: string;
  language?: Language;
}

export interface Grievance {
  grievance_id: string;
  category: string;
  description: string;
  status: "submitted" | "under_review" | "resolved" | "closed";
  created_at: string;
  resolution_notes?: string;
}

export interface GovernmentScheme {
  scheme_id: string;
  scheme_name: string;
  ministry?: string;
  sponsoring_body?: string;
  scheme_type?: string;
  description?: string;
  eligibility?: string;
  eligibility_criteria?: string;
  benefit_amount?: string;
  benefit_amount_inr?: number;
  benefit_description?: string;
  application_url?: string;
  source_url: string;
  is_active?: boolean;
}

export interface NotificationItem {
  id: string;
  notification_id?: string;
  title: string;
  message: string;
  type?: string;
  notification_type?: string;
  category?: string;
  linkUrl?: string;
  createdAt: string;
  created_at?: string;
  read: boolean;
  is_read?: boolean;
  [extra: string]: unknown;
}

// Backward compatibility aliases
export type DocumentRecord = AppDocument;

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface Bottleneck {
  id: string;
  clearanceId: string;
  projectId: string;
  clearanceName: string;
  severity?: "critical" | "moderate" | "low" | string;
  reason?: string;
  suggestedAction?: string;
  estimatedDelayDays?: number;
  sourceFlag?: DemoFlag;
  department?: string;
  pendingDays?: number;
  slaDays?: number | null;
  delayDays?: number | null;
  rootCauseType?: string;
  rootCauseDescription?: string;
  recommendedNextAction?: string;
  [extra: string]: unknown;
}

export interface WorkflowDependency {
  sourceId: string;
  targetId: string;
  type?: "mandatory" | "advisory" | string;
  dependencyType?: string;
  status?: "satisfied" | "pending" | "blocked" | string;
  [extra: string]: unknown;
}

export interface WorkflowNode {
  id: string;
  shortCode?: string;
  name?: string;
  label?: string;
  department?: string;
  stage?: string;
  status?: ClearanceStatus;
  slaDays?: number | null;
  delayStatus?: DelayStatus;
  [extra: string]: unknown;
}

export interface AuditEvent {
  id: string;
  timestamp?: string;
  time?: string;
  userId?: string;
  userName?: string;
  userRole?: Role;
  actor?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  resource?: string;
  details?: string;
  note?: string;
  sourceFlag?: DemoFlag;
  [extra: string]: unknown;
}

export interface RuleSource {
  id: string;
  ruleCode?: string;
  code?: string;
  name?: string;
  category?: string;
  department?: string;
  effectiveDate?: string;
  lastVerifiedDate?: string;
  sourceUrl?: string;
  officialDocumentTitle?: string;
  summary?: string;
  ruleStatus?: "verified" | "unverified" | "pending_review";
  logic?: string;
  result?: string;
  source?: string;
  url?: string;
  [extra: string]: unknown;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
  demo?: boolean;
  source?: string;
  generatedAt?: string;
}


export interface UploadDocumentArgs {
  applicationId: string;
  documentName: string;
  documentType: string;
  file: File;
  onProgress?: (percent: number) => void;
}
export interface CreateApplicationArgs {
  projectId: string;
  applicationType: string;
  licenseTier: string;
}
