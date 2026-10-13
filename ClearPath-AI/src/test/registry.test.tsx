import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { registryApi, type SourceVersion, type RegistryRule } from "@/api/registry";
import { SourcesPage } from "@/features/admin/SourcesPage";
import { RulesPage } from "@/features/admin/RulesPage";
import { RegistryReview } from "@/features/admin/RegistryReview";
import type { PageProps } from "@/app/pageProps";
import { renderApp } from "./utils";

vi.mock("@/api/registry", async importOriginal => ({
  ...await importOriginal<typeof import("@/api/registry")>(),
  registryApi: { sources: vi.fn(), rules: vi.fn(), page: vi.fn(), review: vi.fn(), conflict: vi.fn(), download: vi.fn() },
}));
const source: SourceVersion = {
  id: "source-1", version: 1, title: "Local PDF evidence", state: "NEEDS_REVIEW",
  conflict_note: null, review_note: null, reviewed_at: null, reviewed_by: null, created_by: null,
  source_key: "fssai-evidence", issuer: "FSSAI", canonical_url: null, filename: "evidence.pdf",
  sha256: "a".repeat(64), page_count: 2, received_at: "2026-10-13T00:00:00Z", retrieved_at: null,
  published_on: null, effective_on: null, provenance_note: "Provided locally; original retrieval unknown.",
};
const rules: RegistryRule[] = (["manufacturing", "retail", "distribution"] as const).map(activity => ({
  ...source, id: activity, state: "DRAFT", rule_key: `${activity}-evidence`, activity, kind: "eligibility",
  source_version_id: source.id, title: `${activity} evidence`, page_start: 1, page_end: 1, excerpt: "Cited page passage",
}));
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  vi.mocked(registryApi.sources).mockResolvedValue([source]);
  vi.mocked(registryApi.rules).mockResolvedValue(rules);
  vi.mocked(registryApi.page).mockResolvedValue({ text: "Cited page passage" });
  vi.mocked(registryApi.review).mockResolvedValue({} as never);
});

describe("source registry review", () => {
  it("shows unknown provenance and page evidence without review controls for applicants", async () => {
    localStorage.setItem("cp-role", "applicant");
    renderApp(<SourcesPage />);
    expect(await screen.findByText(/Original retrieval: Unknown/)).toBeInTheDocument();
    expect(screen.getByText(/SHA-256:/)).toHaveTextContent(source.sha256);
    await userEvent.click(screen.getByRole("button", { name: /Inspect version/ }));
    expect(await screen.findByText("Cited page passage")).toBeInTheDocument();
    expect(registryApi.page).toHaveBeenCalledWith(source.id, 1);
    expect(screen.queryByLabelText(/Review reason/)).not.toBeInTheDocument();
  });

  it("requires a reason and preserves the expected state in review submissions", async () => {
    const saved = vi.fn();
    renderApp(<RegistryReview kind="source" record={source} onSaved={saved} />);
    const verify = screen.getByRole("button", { name: /Verify evidence/ });
    expect(verify).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Review reason/), "Reviewed against original evidence");
    await userEvent.click(verify);
    expect(registryApi.review).toHaveBeenCalledWith("source", source, "VERIFIED", "Reviewed against original evidence");
    await vi.waitFor(() => expect(saved).toHaveBeenCalledOnce());
  });

  it("blocks verification while a conflict is recorded", async () => {
    renderApp(<RegistryReview kind="source" record={{...source, conflict_note:"Conflicting source version"}} onSaved={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/Review reason/), "Evidence needs further review");
    expect(screen.getByRole("button", { name: /Verify evidence/ })).toBeDisabled();
    expect(registryApi.review).not.toHaveBeenCalled();
  });

  it("keeps activity-specific drafts distinct and filterable", async () => {
    renderApp(<RulesPage {...{role:"admin"} as PageProps} />);
    await screen.findByRole("button", {name:"Inspect retail: retail-evidence"});
    expect(screen.getAllByRole("button", {name:/Inspect /})).toHaveLength(3);
    await userEvent.selectOptions(screen.getByLabelText("Business activity"), "retail");
    expect(screen.getAllByRole("button", {name:/Inspect /})).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", {name:"Inspect retail: retail-evidence"}));
    expect(screen.getByText("Cited page passage")).toBeInTheDocument();
    expect(screen.queryByRole("button", {name:/Verify evidence/})).not.toBeInTheDocument();
    expect(screen.getByRole("button", {name:"Move to NEEDS_REVIEW"})).toBeDisabled();
  });
});
