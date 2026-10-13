import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./services";
import type {
  Clearance,
  CreateApplicationArgs,
  DocumentRecord,
  Project,
  UploadDocumentArgs,
} from "@/types";

export const qk = {
  projects: ["projects"],
  clearances: ["clearances"],
  documents: ["documents"],
  notifications: ["notifications"],
  rules: ["rules"],
  users: ["users"],
  audit: ["audit"],
  bottlenecks: ["bottlenecks"],
  workflow: ["workflow"],
} as const;

export const useProjects = () =>
  useQuery({
    queryKey: qk.projects,
    queryFn: api.projects.list,
    select: (r) => r.data,
  });
export const useClearances = () =>
  useQuery({
    queryKey: qk.clearances,
    queryFn: api.clearances.list,
    select: (r) => r.data,
  });
export const useDocuments = () =>
  useQuery({
    queryKey: qk.documents,
    queryFn: api.documents.list,
    select: (r) => r.data,
  });
export const useNotifications = () =>
  useQuery({
    queryKey: qk.notifications,
    queryFn: api.notifications.list,
    select: (r) => r.data,
  });
export const useRules = () =>
  useQuery({
    queryKey: qk.rules,
    queryFn: api.rules.list,
    select: (r) => r.data,
  });
export const useUsers = () =>
  useQuery({
    queryKey: qk.users,
    queryFn: api.users.list,
    select: (r) => r.data,
  });
export const useAuditEvents = () =>
  useQuery({
    queryKey: qk.audit,
    queryFn: api.audit.list,
    select: (r) => r.data,
  });
export const useBottlenecks = () =>
  useQuery({
    queryKey: qk.bottlenecks,
    queryFn: api.bottlenecks.list,
    select: (r) => r.data,
  });
export const useWorkflow = () =>
  useQuery({
    queryKey: qk.workflow,
    queryFn: api.workflow.get,
    select: (r) => r.data,
  });

export const useProjectCompliance = (projectId: string) =>
  useQuery({
    queryKey: ["project-compliance", projectId],
    queryFn: () => api.projects.complianceEvaluation(projectId),
    select: (r) => r.data,
    enabled: Boolean(projectId),
  });

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Project) => api.projects.create(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects }),
  });
}
export function useUpdateClearance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: Clearance["status"] }) =>
      api.clearances.updateStatus(v.id, v.status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.clearances });
      void qc.invalidateQueries({ queryKey: qk.bottlenecks });
      void qc.invalidateQueries({ queryKey: qk.workflow });
    },
  });
}
export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<DocumentRecord> }) =>
      api.documents.update(v.id, v.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents }),
  });
}
export function useSetNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { ids: string[] | "all"; read: boolean }) =>
      api.notifications.setRead(v.ids, v.read),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: CreateApplicationArgs) => api.clearances.create(a),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.clearances });
      void qc.invalidateQueries({ queryKey: qk.bottlenecks });
      void qc.invalidateQueries({ queryKey: qk.workflow });
    },
  });
}
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: UploadDocumentArgs) => api.documents.upload(a),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents }),
  });
}
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.documents.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.documents }),
  });
}
