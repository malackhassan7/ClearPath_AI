import type {
  ApiResponse,
  Clearance,
  DocumentRecord,
  NotificationItem,
  Project,
  Bottleneck,
  WorkflowDependency,
  WorkflowNode,
  UploadDocumentArgs,
  CreateApplicationArgs,
} from "@/types";
import { mockDb } from "./db";
import { deriveBottlenecks } from "./seed";

/** Every mock response carries demo:true, source:"Demo data" and generatedAt. */
const respond = async <T>(data: T): Promise<ApiResponse<T>> => {
  await new Promise((r) => setTimeout(r, 120));
  return {
    data,
    demo: true,
    source: "Demo data",
    generatedAt: new Date().toISOString(),
  };
};
const today = () => new Date().toISOString().slice(0, 10);

export const mockApi = {
  projects: {
    list: () => respond(mockDb.get().projects),
    create: async (p: Project) => {
      mockDb.get().projects.unshift(p);
      mockDb.save();
      return respond(p);
    },
  },
  clearances: {
    list: () => respond(mockDb.get().clearances),
    create: async (a: CreateApplicationArgs) => {
      const db = mockDb.get();
      const project = db.projects.find((p) => p.id === a.projectId);
      const c: Clearance = {
        id: `app-${Date.now()}`, projectId: a.projectId, projectName: project?.name ?? "Project",
        name: `${a.applicationType} (${a.licenseTier.replace(/_/g, " ")})`, shortCode: a.applicationType.toUpperCase(),
        department: "FSSAI / Food Safety", stage: "Pre-Operation", status: "not_started", pendingDays: 0, slaDays: null,
        delayStatus: "timeline_unavailable", documentReadinessPercent: 0, dependencies: [],
        nextAction: "Upload the required documents.", ruleCitation: "Timeline unavailable. Confirm with the issuing authority.",
        lastUpdatedDate: today(), demo: true, source: "Demo data",
      };
      db.clearances.unshift(c);
      mockDb.save();
      return respond(c);
    },
    updateStatus: async (id: string, status: Clearance["status"]) => {
      const c = mockDb.get().clearances.find((x) => x.id === id);
      if (c) {
        c.status = status;
        c.lastUpdatedDate = today();
        mockDb.save();
      }
      return respond(c ?? null);
    },
  },
  documents: {
    list: () => respond(mockDb.get().documents),
    upload: async (a: UploadDocumentArgs) => {
      const db = mockDb.get();
      const c = db.clearances.find((x) => x.id === a.applicationId);
      a.onProgress?.(100);
      const d: DocumentRecord = {
        id: `doc-${Date.now()}`, application_id: a.applicationId, projectId: c?.projectId, projectName: c?.projectName,
        documentName: a.documentName, category: a.documentType, mandatory: true, fileName: a.file.name, version: 1,
        status: "uploaded", validationNote: "Demo metadata received. No OCR or legal validation has been performed.",
        demo: true, source: "Demo data",
      };
      db.documents.unshift(d);
      mockDb.save();
      return respond(d);
    },
    remove: async (id: string) => {
      const db = mockDb.get();
      db.documents = db.documents.filter((x) => x.id !== id);
      mockDb.save();
      return respond(null);
    },
    update: async (id: string, patch: Partial<DocumentRecord>) => {
      const d = mockDb.get().documents.find((x) => x.id === id);
      if (d) {
        Object.assign(d, patch, {
          version: Number(d.version || 1) + (patch.fileName ? 1 : 0),
        });
        mockDb.save();
      }
      return respond(d ?? null);
    },
  },
  notifications: {
    list: () => respond(mockDb.get().notifications),
    setRead: async (ids: string[] | "all", read: boolean) => {
      mockDb.get().notifications.forEach((n: NotificationItem) => {
        if (ids === "all" || ids.includes(n.id)) n.read = read;
      });
      mockDb.save();
      return respond(mockDb.get().notifications);
    },
  },
  rules: { list: () => respond(mockDb.get().rules) },
  users: { list: () => respond(mockDb.get().users) },
  audit: { list: () => respond(mockDb.get().audit) },
  bottlenecks: {
    list: (): Promise<ApiResponse<Bottleneck[]>> =>
      respond(deriveBottlenecks(mockDb.get().clearances)),
  },
  workflow: {
    get: (): Promise<
      ApiResponse<{ nodes: WorkflowNode[]; dependencies: WorkflowDependency[] }>
    > => {
      const cs = mockDb.get().clearances;
      const nodes = cs.map((c) => ({
        id: c.id,
        label: c.name,
        department: c.department,
        status: c.status,
      }));
      const dependencies = cs.flatMap((c) =>
        c.dependencies.map((d): WorkflowDependency => ({
          sourceId: d,
          targetId: c.id,
          dependencyType: "prerequisite",
          reason:
            "Demo dependency. Dependency requires authority confirmation.",
          verificationStatus: "requires_authority_confirmation",
        })),
      );
      return respond({ nodes, dependencies });
    },
  },
};
