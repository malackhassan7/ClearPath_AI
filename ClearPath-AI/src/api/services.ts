import { env } from "@/lib/env";
import { ApiRequestError, http } from "./client";
import { mockApi } from "./mock";
import {
  deriveBottlenecks,
  deriveWorkflow,
  envelope,
  fromProject,
  toAudit,
  toClearance,
  toDocument,
  toNotification,
  toProject,
  toUser,
} from "./adapters";
import type {
  ApiResponse,
  AuditEvent,
  Bottleneck,
  Clearance,
  DocumentRecord,
  NotificationItem,
  Project,
  RuleSource,
  User,
  WorkflowDependency,
  WorkflowNode,
  UploadDocumentArgs,
  CreateApplicationArgs,
} from "@/types";

type Json = Record<string, unknown>;
const mock = env.useMockApi;

/** Backends return bare lists; accept either a list or an {data: list} envelope. */
const asList = (d: unknown): Json[] =>
  Array.isArray(d)
    ? (d as Json[])
    : Array.isArray((d as { data?: unknown })?.data)
      ? (d as { data: Json[] }).data
      : [];
const getRaw = async (url: string): Promise<unknown> =>
  (await http.get<unknown>(url)).data;

// ---- live (PostgreSQL-backed FastAPI) helpers ----
const liveProjects = async (): Promise<Project[]> =>
  asList(await getRaw("/projects/")).map(toProject);
const liveClearances = async (): Promise<Clearance[]> => {
  const [projects, apps] = await Promise.all([
    liveProjects(),
    getRaw("/clearances/"),
  ]);
  const names = new Map(projects.map((p) => [p.id, p.name]));
  return asList(apps).map((a) => toClearance(a, names));
};

/** Frontend clearance status -> statuses the backend accepts. */
const TO_BACKEND: Partial<Record<Clearance["status"], string>> = {
  not_started: "draft",
  applied: "submitted",
  under_review: "under_review",
  approved: "approved",
  rejected: "rejected",
  query_raised: "returned",
};
const unsupported = (message: string) =>
  new ApiRequestError(501, "not_implemented", message);

/** Single API facade. Mock module is used only when VITE_USE_MOCK_API=true; live failures are surfaced, never faked. */
export const api = {
  projects: {
    list: async (): Promise<ApiResponse<Project[]>> =>
      mock ? mockApi.projects.list() : envelope(await liveProjects()),
    create: async (p: Project): Promise<ApiResponse<Project>> => {
      if (mock) return mockApi.projects.create(p);
      const res = await http.post<Json>("/projects/", fromProject(p));
      return envelope(toProject(res.data));
    },
  },
  clearances: {
    list: async (): Promise<ApiResponse<Clearance[]>> =>
      mock ? mockApi.clearances.list() : envelope(await liveClearances()),
    create: async (
      a: CreateApplicationArgs,
    ): Promise<ApiResponse<Clearance>> => {
      if (mock) return mockApi.clearances.create(a);
      const res = await http.post<Json>("/clearances/", {
        project_id: a.projectId,
        application_type: a.applicationType,
        license_tier: a.licenseTier,
      });
      return envelope(toClearance(res.data, new Map()));
    },
    updateStatus: async (
      id: string,
      status: Clearance["status"],
    ): Promise<ApiResponse<Clearance | null>> => {
      if (mock) return mockApi.clearances.updateStatus(id, status);
      const backendStatus = TO_BACKEND[status];
      if (!backendStatus)
        throw unsupported("The backend does not support this status.");
      await http.put(`/clearances/${id}/status`, { status: backendStatus });
      return envelope(
        (await liveClearances()).find((c) => c.id === id) ?? null,
      );
    },
  },
  documents: {
    list: async (): Promise<ApiResponse<DocumentRecord[]>> => {
      if (mock) return mockApi.documents.list();
      const clearances = await liveClearances();
      const groups = await Promise.all(
        clearances.map(async (c) => {
          try {
            return asList(await getRaw(`/documents/${c.id}`)).map((d) =>
              toDocument(d, c),
            );
          } catch {
            return []; // one application's documents failing must not blank every page
          }
        }),
      );
      return envelope(groups.flat());
    },
    upload: async (
      a: UploadDocumentArgs,
    ): Promise<ApiResponse<DocumentRecord>> => {
      if (mock) return mockApi.documents.upload(a);
      const form = new FormData();
      form.append("file", a.file);
      const res = await http.post<Json>(
        `/documents/${a.applicationId}/upload`,
        form,
        {
          params: {
            document_name: a.documentName,
            document_type: a.documentType,
          },
          timeout: 60_000,
          onUploadProgress: (e) =>
            a.onProgress?.(
              e.total ? Math.round((e.loaded * 100) / e.total) : 0,
            ),
        },
      );
      return envelope(toDocument(res.data));
    },
    remove: async (id: string): Promise<ApiResponse<null>> => {
      if (mock) return mockApi.documents.remove(id);
      await http.delete(`/documents/${id}`);
      return envelope(null);
    },
    update: async (
      id: string,
      patch: Partial<DocumentRecord>,
    ): Promise<ApiResponse<DocumentRecord | null>> => {
      if (mock) return mockApi.documents.update(id, patch);
      throw unsupported(
        "Document changes are not available from the backend yet.",
      );
    },
  },
  notifications: {
    list: async (): Promise<ApiResponse<NotificationItem[]>> =>
      mock
        ? mockApi.notifications.list()
        : envelope(asList(await getRaw("/notifications")).map(toNotification)),
    setRead: async (
      ids: string[] | "all",
      read: boolean,
    ): Promise<ApiResponse<NotificationItem[]>> => {
      if (mock) return mockApi.notifications.setRead(ids, read);
      if (read) {
        if (ids === "all") await http.put("/notifications/read-all");
        else
          await Promise.all(
            ids.map((i) => http.put(`/notifications/${i}/read`)),
          );
      }
      return envelope(
        asList(await getRaw("/notifications")).map(toNotification),
      );
    },
  },
  rules: {
    // The backend has no generic rules-registry endpoint yet; show an honest empty list.
    list: async (): Promise<ApiResponse<RuleSource[]>> =>
      mock ? mockApi.rules.list() : envelope([] as RuleSource[]),
  },
  users: {
    list: async (): Promise<ApiResponse<User[]>> =>
      mock
        ? mockApi.users.list()
        : envelope(asList(await getRaw("/admin/users")).map(toUser)),
  },
  audit: {
    list: async (): Promise<ApiResponse<AuditEvent[]>> =>
      mock
        ? mockApi.audit.list()
        : envelope(asList(await getRaw("/admin/audit-logs")).map(toAudit)),
  },
  bottlenecks: {
    list: async (): Promise<ApiResponse<Bottleneck[]>> =>
      mock
        ? mockApi.bottlenecks.list()
        : envelope(deriveBottlenecks(await liveClearances())),
  },
  workflow: {
    get: async (): Promise<
      ApiResponse<{ nodes: WorkflowNode[]; dependencies: WorkflowDependency[] }>
    > =>
      mock
        ? mockApi.workflow.get()
        : envelope(deriveWorkflow(await liveClearances())),
  },
};
