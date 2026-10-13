export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "applicant" | "consultant" | "officer" | "admin";
  organizationId: string;
  status: "active" | "locked" | "pending";
}
export interface Organization {
  id: string;
  name: string;
  type: string;
  district: string;
}
export interface Project {
  id: string;
  name: string;
  organizationId: string;
  district: string;
  industryCategory: string;
  createdAt: string;
}
export interface Clearance {
  id: string;
  projectId: string;
  serviceName: string;
  departmentName: string;
  status: string;
  prescribedTimeLimitDays: number | null;
}
export interface ClearanceRequirement {
  id: string;
  clearanceId: string;
  title: string;
  sourceUrl: string;
  verified: boolean;
}
export interface ClearancePerformanceRecord {
  record_id: string;
  department_name: string;
  service_name: string;
  service_category: string;
  prescribed_time_limit_days: number;
  applications_received: number;
  applications_processed: number;
  applications_approved: number;
  applications_rejected: number;
  average_approval_days: number | null;
  median_approval_days: number | null;
  minimum_approval_days: number | null;
  maximum_approval_days: number | null;
  average_fee_collected: string;
  delay_ratio: number | null;
  delay_excess_days: number | null;
  delay_severity: DelaySeverity;
  bottleneck_score: number | null;
  rejection_rate_pct: number | null;
  data_source: string;
  data_source_url: string;
  data_retrieved_on: string;
  notes: string;
  risk_level: "Extreme delay risk" | null;
  bottleneck_level: BottleneckLevel;
}
export type DelaySeverity =
  | "Timeline unavailable"
  | "Within expected time"
  | "Mild delay"
  | "High delay"
  | "Critical delay";
export type BottleneckLevel =
  | "Timeline unavailable"
  | "No bottleneck"
  | "Low bottleneck"
  | "High bottleneck"
  | "Critical bottleneck";
export interface DelayAnalysis {
  record: ClearancePerformanceRecord;
  explanation: string;
  source: string;
  sourceUrl: string;
  retrievedOn: string;
}
export interface Bottleneck {
  id: string;
  recordId: string;
  serviceName: string;
  departmentName: string;
  score: number;
  level: BottleneckLevel;
}
export interface WorkflowNode {
  id: string;
  label: string;
  status: string;
  sourceUrl?: string;
}
export interface WorkflowDependency {
  fromId: string;
  toId: string;
  verificationStatus: "verified" | "requires_authority_confirmation";
  sourceUrl?: string;
}
export interface Document {
  id: string;
  projectId: string;
  name: string;
  status: string;
}
export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
export interface AuditEvent {
  id: string;
  actorId: string;
  action: string;
  occurredAt: string;
  details: string;
}
export interface RuleSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  checkedOn: string;
  status: "verified" | "needs_review";
}
export interface Report {
  id: string;
  title: string;
  createdAt: string;
  status: "available" | "unavailable";
}
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}
export interface ApiError {
  status: number;
  code: string;
  message: string;
}
export interface ApiEnvelope<T> {
  data: T;
  source?: string;
  data_retrieved_on?: string;
  demo?: boolean;
  generatedAt?: string;
}
