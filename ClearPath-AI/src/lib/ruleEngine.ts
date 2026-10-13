import type { Bottleneck, BottleneckLevel, ClearancePerformanceRecord, DelayAnalysis, DelaySeverity } from "@/api/types";

export function calculateDelayRatio(average: number | null, prescribed: number): number | null {
  return prescribed > 0 && average !== null && Number.isFinite(average) ? average / prescribed : null;
}
export function calculateDelayExcess(average: number | null, prescribed: number): number | null {
  return average !== null && Number.isFinite(average) ? average - prescribed : null;
}
export function calculateDelaySeverity(average: number | null, prescribed: number): DelaySeverity {
  if (prescribed <= 0 || average === null || !Number.isFinite(average)) return "Timeline unavailable";
  if (average <= prescribed) return "Within expected time";
  const ratio = average / prescribed;
  if (ratio <= 2) return "Mild delay";
  if (ratio <= 5) return "High delay";
  return "Critical delay";
}
export function calculateBottleneckScore(ratio: number | null, received: number): number | null {
  return ratio === null || received < 0 ? null : ratio * Math.log1p(received);
}
export function calculateRejectionRate(rejected: number, received: number): number | null {
  return received > 0 && rejected >= 0 ? (rejected / received) * 100 : null;
}
export function calculateExtremeDelayRisk(maximum: number | null, prescribed: number): "Extreme delay risk" | null {
  return prescribed > 0 && maximum !== null && maximum > prescribed * 10 ? "Extreme delay risk" : null;
}
export function calculateBottleneckLevel(ratio: number | null): BottleneckLevel {
  if (ratio === null) return "Timeline unavailable";
  if (ratio <= 1) return "No bottleneck";
  if (ratio <= 2) return "Low bottleneck";
  if (ratio <= 5) return "High bottleneck";
  return "Critical bottleneck";
}
export function enrichPerformanceRecord(record: Omit<ClearancePerformanceRecord, "delay_ratio" | "delay_excess_days" | "delay_severity" | "bottleneck_score" | "rejection_rate_pct" | "risk_level" | "bottleneck_level">): ClearancePerformanceRecord {
  const ratio = calculateDelayRatio(record.average_approval_days, record.prescribed_time_limit_days);
  return { ...record, delay_ratio: ratio, delay_excess_days: calculateDelayExcess(record.average_approval_days, record.prescribed_time_limit_days), delay_severity: calculateDelaySeverity(record.average_approval_days, record.prescribed_time_limit_days), bottleneck_score: calculateBottleneckScore(ratio, record.applications_received), rejection_rate_pct: calculateRejectionRate(record.applications_rejected, record.applications_received), risk_level: calculateExtremeDelayRisk(record.maximum_approval_days, record.prescribed_time_limit_days), bottleneck_level: calculateBottleneckLevel(ratio) };
}
export function rankBottlenecks(records: ClearancePerformanceRecord[]): Bottleneck[] {
  return records.filter((r) => r.bottleneck_score !== null).map((r) => ({ id: r.record_id, recordId: r.record_id, serviceName: r.service_name, departmentName: r.department_name, score: r.bottleneck_score ?? 0, level: r.bottleneck_level })).sort((a, b) => b.score - a.score);
}
export function explainDelayResult(record: ClearancePerformanceRecord): DelayAnalysis {
  let explanation: string;
  if (record.delay_ratio === null || record.delay_excess_days === null) explanation = "Timeline unavailable: the official prescribed time limit is zero or the average approval time is missing.";
  else if (record.delay_excess_days <= 0) explanation = `Average approval time is ${Math.abs(record.delay_excess_days).toFixed(1)} days within the prescribed limit.`;
  else explanation = `Average approval time exceeds the prescribed limit by ${record.delay_excess_days.toFixed(1)} days.`;
  if (record.applications_processed === 0) explanation += " The dashboard reports no processed applications; interpret approval-time statistics cautiously.";
  return { record, explanation, source: record.data_source, sourceUrl: record.data_source_url, retrievedOn: record.data_retrieved_on };
}
