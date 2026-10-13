import { http } from "./client";

export type ReviewState = "DRAFT" | "NEEDS_REVIEW" | "VERIFIED" | "DISABLED" | "SUPERSEDED";
export type Activity = "manufacturing" | "retail" | "distribution";
export interface ReviewRecord {
  id: string; version: number; title: string; state: ReviewState;
  conflict_note: string | null; review_note: string | null; reviewed_at: string | null;
  reviewed_by: string | null; created_by: string | null;
}
export interface SourceVersion extends ReviewRecord {
  source_key: string; issuer: string; canonical_url: string | null; filename: string;
  sha256: string; page_count: number; received_at: string; retrieved_at: string | null;
  published_on: string | null; effective_on: string | null; provenance_note: string;
}
export interface RegistryRule extends ReviewRecord {
  rule_key: string; activity: Activity; kind: "eligibility" | "checklist" | "application_form";
  source_version_id: string; page_start: number; page_end: number; excerpt: string;
}
export const registryApi = {
  sources: async () => (await http.get<SourceVersion[]>("/sources")).data,
  source: async (id: string) => (await http.get<SourceVersion>(`/sources/versions/${id}`)).data,
  rules: async () => (await http.get<RegistryRule[]>("/registry/rules")).data,
  rule: async (id: string) => (await http.get<RegistryRule>(`/registry/rules/${id}`)).data,
  page: async (id: string, page: number) => (await http.get<{ text: string }>(`/sources/versions/${id}/pages/${page}`)).data,
  download: async (id: string) => {
    const response = await http.get<Blob>(`/sources/versions/${id}/file`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a"); link.href = url; link.download = `source-${id}.pdf`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  review: async (kind: "source" | "rule", record: ReviewRecord, state: ReviewState, reason: string) => {
    const path = kind === "source" ? `/sources/versions/${record.id}` : `/registry/rules/${record.id}`;
    return http.post(`${path}/review`, { expected_state: record.state, state, reason });
  },
  conflict: async (kind: "source" | "rule", id: string, conflict_note: string | null, reason: string) => {
    const path = kind === "source" ? `/sources/versions/${id}` : `/registry/rules/${id}`;
    return http.post(`${path}/conflict`, { conflict_note, reason });
  },
};
export const transitions: Record<ReviewState, ReviewState[]> = {
  DRAFT: ["NEEDS_REVIEW", "DISABLED"],
  NEEDS_REVIEW: ["DRAFT", "VERIFIED", "DISABLED", "SUPERSEDED"],
  VERIFIED: ["NEEDS_REVIEW", "DISABLED", "SUPERSEDED"],
  DISABLED: ["NEEDS_REVIEW"], SUPERSEDED: [],
};
