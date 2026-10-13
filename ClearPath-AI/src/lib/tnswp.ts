import csvText from "@/data/tnswp/tnswp_clearance_dashboard_dataset.csv?raw";
import type { ClearancePerformanceRecord, DelaySeverity } from "@/api/types";
import { enrichPerformanceRecord } from "@/lib/ruleEngine";

const required = ["record_id", "department_name", "service_name", "service_category", "prescribed_time_limit_days", "applications_received", "applications_processed", "applications_approved", "applications_rejected", "average_approval_days", "median_approval_days", "minimum_approval_days", "maximum_approval_days", "average_fee_collected", "data_source", "data_source_url", "data_retrieved_on", "notes"] as const;
type RawRow = Record<string, string>;
function parseCsv(text: string): RawRow[] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift()?.map((h) => h.replace(/^\uFEFF/, "").trim()) ?? [];
  const missing = required.filter((key) => !headers.includes(key));
  if (missing.length) throw new Error(`TNSWP CSV is missing required columns: ${missing.join(", ")}`);
  return rows.filter((r) => r.some((v) => v.trim() !== "")).map((values) => Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()])) as RawRow);
}
function numberOrNull(value: string | undefined, field: string, recordId: string): number | null {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid ${field} for ${recordId}`);
  return parsed;
}
function requiredNumber(row: RawRow, field: string): number {
  const value = numberOrNull(row[field], field, row.record_id);
  if (value === null) throw new Error(`Missing ${field} for ${row.record_id}`);
  return value;
}
export function parseTnswpCsv(text: string): ClearancePerformanceRecord[] {
  const seen = new Set<string>();
  return parseCsv(text).map((row) => {
    if (!row.record_id || !row.department_name || !row.service_name || !row.data_source_url || !row.data_retrieved_on) throw new Error("TNSWP row is missing its identity or source metadata.");
    if (seen.has(row.record_id)) throw new Error(`Duplicate TNSWP record ID: ${row.record_id}`);
    seen.add(row.record_id);
    const prescribed = requiredNumber(row, "prescribed_time_limit_days");
    const received = requiredNumber(row, "applications_received");
    const processed = requiredNumber(row, "applications_processed");
    const approved = requiredNumber(row, "applications_approved");
    const rejected = requiredNumber(row, "applications_rejected");
    if (processed !== approved + rejected) throw new Error(`Processed count does not equal approved + rejected for ${row.record_id}`);
    const average = numberOrNull(row.average_approval_days, "average_approval_days", row.record_id);
    const median = numberOrNull(row.median_approval_days, "median_approval_days", row.record_id);
    const minimum = numberOrNull(row.minimum_approval_days, "minimum_approval_days", row.record_id);
    const maximum = numberOrNull(row.maximum_approval_days, "maximum_approval_days", row.record_id);
    const base = { record_id: row.record_id, department_name: row.department_name, service_name: row.service_name, service_category: row.service_category, prescribed_time_limit_days: prescribed, applications_received: received, applications_processed: processed, applications_approved: approved, applications_rejected: rejected, average_approval_days: average, median_approval_days: median, minimum_approval_days: minimum, maximum_approval_days: maximum, average_fee_collected: row.average_fee_collected, data_source: row.data_source, data_source_url: row.data_source_url, data_retrieved_on: row.data_retrieved_on, notes: row.notes };
    return enrichPerformanceRecord(base);
  });
}
export const tnswpPerformanceRecords = parseTnswpCsv(csvText);
export const tnswpDataStatus: { source: string; url: string; retrievedOn: string; recordCount: number; } = {
  source: "Tamil Nadu Single Window Portal Dashboard",
  url: "https://uat.tnswp.com/DIGIGOV/digigov.htm?actionFlag=loadOnlineSingleWindowPortalDashboard&pagedisp=static",
  retrievedOn: tnswpPerformanceRecords[0]?.data_retrieved_on ?? "",
  recordCount: tnswpPerformanceRecords.length,
};
export function getTnswpRecords(): ClearancePerformanceRecord[] { return [...tnswpPerformanceRecords]; }
export function getTnswpRecord(id: string): ClearancePerformanceRecord | undefined { return tnswpPerformanceRecords.find((record) => record.record_id === id); }
export function getTnswpDelaySeverities(): DelaySeverity[] { return ["Timeline unavailable", "Within expected time", "Mild delay", "High delay", "Critical delay"]; }
