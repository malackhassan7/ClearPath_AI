import { useQuery } from "@tanstack/react-query";
import { getTnswpRecord, getTnswpRecords } from "@/lib/tnswp";
import { rankBottlenecks } from "@/lib/ruleEngine";
import type { ClearancePerformanceRecord } from "@/api/types";
import { queryKeys } from "@/api/queryKeys";

export const useClearancePerformance = () =>
  useQuery({
    queryKey: queryKeys.clearancePerformance,
    queryFn: getTnswpRecords,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
export const useDelayedClearances = () =>
  useQuery({
    queryKey: queryKeys.delayedClearances,
    queryFn: () =>
      getTnswpRecords().filter(
        (r) => r.delay_ratio !== null && r.delay_ratio > 1,
      ),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
export const useBottleneckRanking = () =>
  useQuery({
    queryKey: queryKeys.bottleneckRanking,
    queryFn: () => rankBottlenecks(getTnswpRecords()),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
export const useDepartmentBottlenecks = () =>
  useQuery({
    queryKey: queryKeys.departmentBottlenecks,
    queryFn: () => {
      const groups = new Map<string, ClearancePerformanceRecord[]>();
      for (const record of getTnswpRecords())
        groups.set(record.department_name, [
          ...(groups.get(record.department_name) ?? []),
          record,
        ]);
      return [...groups.entries()]
        .map(([departmentName, records]) => ({
          departmentName,
          serviceCount: records.length,
          delayedCount: records.filter(
            (r) => r.delay_ratio !== null && r.delay_ratio > 1,
          ).length,
          criticalCount: records.filter(
            (r) => r.bottleneck_level === "Critical bottleneck",
          ).length,
          records,
        }))
        .sort(
          (a, b) =>
            b.criticalCount - a.criticalCount ||
            b.delayedCount - a.delayedCount,
        );
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
export const useClearanceDetail = (id: string) =>
  useQuery({
    queryKey: queryKeys.clearanceDetail(id),
    queryFn: () => getTnswpRecord(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
