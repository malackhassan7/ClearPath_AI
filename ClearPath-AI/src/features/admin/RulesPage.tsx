import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { registryApi, type Activity } from "@/api/registry";
import type { PageProps } from "@/app/pageProps";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { RegistryReview } from "./RegistryReview";

export function RulesPage({role}: PageProps) {
  const query = useQuery({queryKey:["registry-rules"], queryFn:registryApi.rules});
  const sources = useQuery({queryKey:["registry-sources"], queryFn:registryApi.sources});
  const [activity, setActivity] = useState<Activity | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const rule = query.data?.find(r => r.id === selected);
  const source = sources.data?.find(s => s.id === rule?.source_version_id);
  if (query.isPending) return <LoadingSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  return <>
    <PageHeader eyebrow="REGULATORY RULE REVIEW" title="Rules and page evidence" subtitle="Draft passages preserve the evidence. Verification is an internal review, not a licence, fee determination or legal approval." />
    <label>Business activity <select value={activity} onChange={e => setActivity(e.target.value as Activity | "all")}>
      <option value="all">All activities</option><option value="manufacturing">Manufacturing</option><option value="retail">Retail</option><option value="distribution">Distribution</option>
    </select></label>
    <div className="source-cards">{query.data?.filter(r => activity === "all" || r.activity === activity).map(r => <article className="panel source-card" key={r.id}>
      <h3>{r.title}</h3><b>{r.state} · Version {r.version}</b><p>{r.activity} · {r.kind} · Pages {r.page_start}–{r.page_end}</p>
      {r.conflict_note && <p><strong>Unresolved conflict:</strong> {r.conflict_note}</p>}
      <button className="btn secondary" onClick={() => setSelected(r.id)}>Inspect {r.activity}: {r.rule_key}</button>
    </article>)}</div>
    {!query.data?.length && <p>No rule drafts have been imported.</p>}
    {rule && <section className="panel"><h2>{rule.title}</h2>
      <p>Source: {source ? `${source.title}, version ${source.version}, ${source.state}` : "Source evidence unavailable"}</p>
      <p style={{overflowWrap:"anywhere"}}>Source SHA-256: {source?.sha256 ?? "Unavailable"}</p>
      <pre style={{whiteSpace:"pre-wrap"}}>{rule.excerpt}</pre><p>Review note: {rule.review_note ?? "Not reviewed"}</p>
      {(role === "admin" || role === "officer") && <RegistryReview kind="rule" record={rule} onSaved={() => void query.refetch()} />}
    </section>}
  </>;
}
