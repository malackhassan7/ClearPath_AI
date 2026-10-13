import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/app/App";
import { mockDb } from "@/api/mock/db";
import { MAX_BYTES, validateFile } from "@/features/documents/fileRules";
import { renderApp } from "./utils";

const pdf = (name = "plan.pdf", size = 1024) => new File([new Uint8Array(size)], name, { type: "application/pdf" });

describe("validateFile", () => {
  it("accepts PDF/PNG/JPG within 5 MB and rejects everything else", () => {
    expect(validateFile(pdf())).toBe("");
    expect(validateFile(new File(["x"], "a.png", { type: "image/png" }))).toBe("");
    expect(validateFile(null)).toMatch(/choose a file/i);
    expect(validateFile(new File(["x"], "a.txt", { type: "text/plain" }))).toMatch(/PDF, PNG or JPG/);
    expect(validateFile(new File(["x"], "a.exe", { type: "application/x-msdownload" }))).toMatch(/PDF, PNG or JPG/);
    expect(validateFile(pdf("big.pdf", MAX_BYTES + 1))).toMatch(/5 MB/);
    expect(validateFile(pdf("empty.pdf", 0))).toMatch(/empty/i);
  });
});

describe("live API calls for documents", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_USE_MOCK_API", "false");
  });
  it("uploads as multipart to the real route, deletes, and creates an application", async () => {
    const post = vi.fn(async (url: string) => ({
      data: url.includes("/upload")
        ? { document_id: "d9", file_url: "uploads/x.pdf", upload_status: "uploaded", validation_status: "pending", document_name: "Site plan" }
        : { application_id: "a1", project_id: "p1", application_type: "FSSAI", license_tier: "state_license", status: "draft", created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" },
    }));
    const del = vi.fn(async () => ({ data: null }));
    vi.doMock("@/api/client", () => ({ ApiRequestError: class extends Error {}, http: { post, delete: del, get: vi.fn() } }));
    const { api } = await import("@/api/services");
    const file = pdf("site.pdf");
    const up = await api.documents.upload({ applicationId: "a1", documentName: "Site plan", documentType: "Technical / Drawings", file });
    const call = post.mock.calls[0] as unknown as [string, FormData, { params: Record<string, string> }];
    expect(call[0]).toBe("/documents/a1/upload");
    expect(call[1]).toBeInstanceOf(FormData);
    expect((call[1] as FormData).get("file")).toBeInstanceOf(File);
    expect(call[2].params).toEqual({ document_name: "Site plan", document_type: "Technical / Drawings" });
    expect(up.data).toMatchObject({ id: "d9", documentName: "Site plan", status: "awaiting_review" });
    await api.documents.remove("d9");
    expect(del).toHaveBeenCalledWith("/documents/d9");
    const app = await api.clearances.create({ projectId: "p1", applicationType: "FSSAI", licenseTier: "state_license" });
    expect(post).toHaveBeenLastCalledWith("/clearances/", { project_id: "p1", application_type: "FSSAI", license_tier: "state_license" });
    expect(app.data.id).toBe("a1");
    vi.doUnmock("@/api/client");
  });
});

describe("Documents page (demo mode)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockDb.reset();
    localStorage.setItem("cp-auth", "true");
    localStorage.setItem("cp-access-token", "t");
    localStorage.setItem("cp-role", "applicant");
  });

  it("uploads a new document through the dialog and shows it in the table", async () => {
    const user = userEvent.setup();
    renderApp(<App />, "/documents");
    await user.click(await screen.findByRole("button", { name: /upload document/i }));
    const dialog = await screen.findByRole("dialog", { name: /upload a document/i });
    await user.type(within(dialog).getByLabelText(/document name/i), "Boiler certificate");
    await user.upload(within(dialog).getByLabelText(/choose a file/i), pdf("boiler.pdf"));
    await user.click(within(dialog).getByRole("button", { name: /upload document/i }));
    expect(await screen.findByText("Boiler certificate")).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("rejects a disallowed file type with an inline error and keeps the dialog open", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderApp(<App />, "/documents");
    await user.click(await screen.findByRole("button", { name: /upload document/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/document name/i), "Notes");
    await user.upload(within(dialog).getByLabelText(/choose a file/i), new File(["hi"], "notes.txt", { type: "text/plain" }));
    await user.click(within(dialog).getByRole("button", { name: /upload document/i }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/PDF, PNG or JPG/);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("asks for confirmation before removing a document", async () => {
    const user = userEvent.setup();
    renderApp(<App />, "/documents");
    const before = (await screen.findAllByRole("button", { name: /^inspect /i })).length;
    await user.click((await screen.findAllByRole("button", { name: /^inspect /i }))[0]);
    await user.click(await screen.findByRole("button", { name: /remove this document/i }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(/cannot be undone/i);
    await user.click(screen.getByRole("button", { name: /yes, remove/i }));
    await vi.waitFor(() => expect(screen.getAllByRole("button", { name: /^inspect /i }).length).toBe(before - 1));
  });
});
