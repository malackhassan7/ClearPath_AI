import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/api/services";
import { mockDb } from "@/api/mock/db";
import { App } from "@/app/App";
import { renderApp } from "./utils";

beforeEach(() => {
  localStorage.clear();
  mockDb.reset();
  vi.restoreAllMocks();
});

describe("mock API envelope", () => {
  it("marks every mock response as demo data with a timestamp", async () => {
    const responses = await Promise.all([
      api.projects.list(),
      api.clearances.list(),
      api.documents.list(),
      api.notifications.list(),
      api.rules.list(),
      api.users.list(),
      api.audit.list(),
      api.bottlenecks.list(),
      api.workflow.get(),
    ]);
    for (const r of responses) {
      expect(r.demo).toBe(true);
      expect(r.source).toBe("Demo data");
      expect(Number.isNaN(Date.parse(r.generatedAt || ""))).toBe(false);
    }
  });

  it('shows "timeline unavailable" status for clearances without a published timeline', async () => {
    const { data } = await api.clearances.list();
    expect(
      data.some(
        (c: any) => c.slaDays === null && c.delayStatus === "timeline_unavailable",
      ),
    ).toBe(true);
  });

  it("persists a status update", async () => {
    await api.clearances.updateStatus("c4", "applied");
    const { data } = await api.clearances.list();
    expect(data.find((c: any) => c.id === "c4")?.status).toBe("applied");
  });
});

describe("data-driven pages", () => {
  const signIn = () => {
    localStorage.setItem("cp-auth", "true");
    localStorage.setItem("cp-access-token", "test-token");
    localStorage.setItem("cp-role", "applicant");
  };

  it("shows a loading state and then project data with the Demo data badge", async () => {
    signIn();
    renderApp(<App />, "/projects");
    expect(screen.getByRole("status", { name: "" })).toBeInTheDocument();
    expect(
      (await screen.findAllByText(/Demo Precision Foods/i)).length,
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText(/demo data mode/i)).toBeInTheDocument();
  });

  it("shows an error state with retry and no stack trace when the API fails", async () => {
    signIn();
    const spy = vi
      .spyOn(api.projects, "list")
      .mockRejectedValue(new Error("boom at stack.js:1"));
    renderApp(<App />, "/projects");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/stack\.js/)).not.toBeInTheDocument();
    spy.mockRestore();
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(
      (await screen.findAllByText(/Demo Precision Foods/i)).length,
    ).toBeGreaterThan(0);
  });
});
