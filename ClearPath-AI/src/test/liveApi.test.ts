import { describe, it, expect, beforeEach, vi } from "vitest";
import { deriveBottlenecks, fromProject, toClearance, toNotification, toProject } from "@/api/adapters";
import type { Project } from "@/types";

const PID = "11111111-1111-1111-1111-111111111111";
const AID = "22222222-2222-2222-2222-222222222222";
const backend: Record<string, unknown> = {
  "/projects/": [{ project_id: PID, project_name: "Demo Dairy Outlet", district: "Coimbatore", status: "draft", capacity_lpd: 500, annual_turnover: "1200000", created_at: "2026-10-01T10:00:00Z", updated_at: "2026-10-02T10:00:00Z" }],
  "/clearances/": [{ application_id: AID, project_id: PID, application_type: "FSSAI", license_tier: "state_license", status: "returned", submission_date: "2026-09-01T00:00:00Z", created_at: "2026-09-01T00:00:00Z", updated_at: "2026-10-02T00:00:00Z" }],
  [`/documents/${AID}`]: [{ document_id: "d1", file_url: "x", upload_status: "uploaded", validation_status: "flagged", document_name: "Site plan" }],
  "/notifications": [{ notification_id: "n1", title: "Returned", message: "Check comments", notification_type: "warning", is_read: false, created_at: "2026-10-03T00:00:00Z", related_entity_type: "application" }],
};

describe("adapters", () => {
  it("maps backend project and clearance fields", () => {
    const p = toProject((backend["/projects/"] as Record<string, unknown>[])[0]);
    expect(p.id).toBe(PID);
    expect(p.name).toBe("Demo Dairy Outlet");
    expect(p.status).toBe("Draft");
    const c = toClearance((backend["/clearances/"] as Record<string, unknown>[])[0], new Map([[PID, p.name]]));
    expect(c.status).toBe("query_raised");
    expect(c.projectName).toBe("Demo Dairy Outlet");
    expect(c.delayStatus).toBe("timeline_unavailable");
    expect(deriveBottlenecks([c])).toHaveLength(1);
  });
  it("builds a backend ProjectCreate payload and maps notifications", () => {
    const body = fromProject({ id: "x", name: "N", district: "Salem", status: "s", capacity_lpd: 10, brand_id: "not-a-uuid" } as Project);
    expect(body).toMatchObject({ project_name: "N", district: "Salem", brand_id: null, capacity_lpd: 10 });
    const n = toNotification((backend["/notifications"] as Record<string, unknown>[])[0]);
    expect(n).toMatchObject({ id: "n1", read: false, category: "delay_alert" });
  });
});

describe("live mode (real backend shapes)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_USE_MOCK_API", "false");
  });

  it("loads projects, clearances, documents and bottlenecks without any envelope from the backend", async () => {
    vi.doMock("@/api/client", () => ({
      ApiRequestError: class extends Error {},
      http: { get: async (url: string) => { if (!(url in backend)) throw new Error("404 " + url); return { data: backend[url] }; }, put: vi.fn(), post: vi.fn() },
    }));
    const { api } = await import("@/api/services");
    expect((await api.projects.list()).data[0].name).toBe("Demo Dairy Outlet");
    const cl = (await api.clearances.list()).data;
    expect(cl[0].projectName).toBe("Demo Dairy Outlet");
    const docs = (await api.documents.list()).data;
    expect(docs[0]).toMatchObject({ documentName: "Site plan", status: "needs_correction" });
    expect((await api.bottlenecks.list()).data).toHaveLength(1);
    expect((await api.rules.list()).data).toEqual([]);
    expect((await api.notifications.list()).data[0].title).toBe("Returned");
    vi.doUnmock("@/api/client");
  });

  it("does not blank the documents page when one application's documents fail", async () => {
    vi.doMock("@/api/client", () => ({
      ApiRequestError: class extends Error {},
      http: { get: async (url: string) => { if (url.startsWith("/documents/")) throw new Error("500"); return { data: backend[url] }; } },
    }));
    const { api } = await import("@/api/services");
    expect((await api.documents.list()).data).toEqual([]);
    vi.doUnmock("@/api/client");
  });
});
