export const queryKeys = {
  clearancePerformance: ["clearance-performance"] as const,
  delayedClearances: ["clearance-performance", "delayed"] as const,
  bottleneckRanking: ["bottlenecks", "ranking"] as const,
  departmentBottlenecks: ["bottlenecks", "departments"] as const,
  clearanceDetail: (id: string) => ["clearance-performance", id] as const,
  projectClearances: (id: string) => ["project-clearances", id] as const,
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  documents: ["documents"] as const,
  notifications: ["notifications"] as const,
  auditEvents: ["audit-events"] as const,
  ruleSources: ["rule-sources"] as const,
} as const;
