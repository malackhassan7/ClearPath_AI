import { describe, expect, it } from "vitest";
import { tnswpPerformanceRecords, parseTnswpCsv } from "@/lib/tnswp";
import {
  calculateBottleneckLevel,
  calculateBottleneckScore,
  calculateDelayExcess,
  calculateDelayRatio,
  calculateDelaySeverity,
  calculateExtremeDelayRisk,
  calculateRejectionRate,
  explainDelayResult,
  rankBottlenecks,
} from "@/lib/ruleEngine";

describe("TNSWP source snapshot", () => {
  it("loads only the three configured departments and has source metadata on every row", () => {
    expect(tnswpPerformanceRecords).toHaveLength(36);
    expect(new Set(tnswpPerformanceRecords.map((r) => r.department_name))).toEqual(new Set([
      "Fire and Rescue Services Department",
      "Directorate of Industrial Safety and Health",
      "Tamil Nadu Pollution Control Board",
    ]));
    expect(tnswpPerformanceRecords.every((r) => r.data_source.includes("Tamil Nadu Single Window Portal") && r.data_source_url.startsWith("https://") && r.data_retrieved_on === "2026-10-10")).toBe(true);
    expect(tnswpPerformanceRecords.every((r) => r.applications_processed === r.applications_approved + r.applications_rejected)).toBe(true);
  });
  it("rejects malformed or inconsistent records instead of silently fixing them", () => {
    const invalid = "record_id,department_name,service_name,service_category,prescribed_time_limit_days,applications_received,applications_processed,applications_approved,applications_rejected,average_approval_days,median_approval_days,minimum_approval_days,maximum_approval_days,average_fee_collected,data_source,data_source_url,data_retrieved_on,notes\nTNSWP-X,Dept,Service,Cat,10,3,3,2,0,2,2,1,3,-,Tamil Nadu Single Window Portal Dashboard,https://example.gov,2026-10-10,"
    expect(() => parseTnswpCsv(invalid)).toThrow(/Processed count does not equal approved \+ rejected/);
  });
});

describe("explainable delay rule engine", () => {
  it("calculates delay ratio, excess, severity and bottleneck level", () => {
    expect(calculateDelayRatio(388, 30)).toBeCloseTo(12.9333, 3);
    expect(calculateDelayExcess(388, 30)).toBe(358);
    expect(calculateDelaySeverity(388, 30)).toBe("Critical delay");
    expect(calculateBottleneckLevel(12.9333)).toBe("Critical bottleneck");
  });
  it("keeps missing or zero-limit values unavailable instead of estimating", () => {
    expect(calculateDelayRatio(12, 0)).toBeNull();
    expect(calculateDelaySeverity(12, 0)).toBe("Timeline unavailable");
    expect(calculateRejectionRate(1, 0)).toBeNull();
    expect(calculateBottleneckScore(null, 4)).toBeNull();
  });
  it("calculates rejection rate and extreme-delay flag from source values", () => {
    expect(calculateRejectionRate(16, 199)).toBeCloseTo(8.0402, 3);
    expect(calculateExtremeDelayRisk(1082, 30)).toBe("Extreme delay risk");
    expect(calculateExtremeDelayRisk(100, 30)).toBeNull();
  });
  it("ranks bottlenecks and returns an evidence-linked explanation", () => {
    const ranked = rankBottlenecks(tnswpPerformanceRecords);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[ranked.length - 1].score);
    const critical = tnswpPerformanceRecords.find((r) => r.service_name === "No Objection Certificate for Non-Multi Storied Buildings (Non-MSB)");
    expect(critical).toBeDefined();
    if (critical) {
      const explanation = explainDelayResult(critical);
      expect(explanation.sourceUrl).toContain("tnswp.com");
      expect(explanation.retrievedOn).toBe("2026-10-10");
      expect(explanation.explanation).toContain("exceeds the prescribed limit");
    }
  });
});
