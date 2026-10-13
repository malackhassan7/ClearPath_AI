import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { registryApi } from "@/api/registry";
import { useSession } from "@/app/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { RegistryReview } from "./RegistryReview";

export function SourcesPage() {
  const { role } = useSession();
  const query = useQuery({ queryKey: ["registry-sources"], queryFn: registryApi.sources });
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [downloadError, setDownloadError] = useState("");
  const source = query.data?.find(s => s.id === selected);
  const passage = useQuery({ queryKey: ["source-page", selected, page], queryFn: () => registryApi.page(selected!, page), enabled: !!selected });
  if (query.isPending) return <LoadingSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  return <>
    <PageHeader eyebrow="REGULATORY EVIDENCE" title="Versioned source registry" subtitle="Local PDF evidence. Review status does not establish legal approval or current applicability." />
    <p className="screening-note">Original retrieval dates remain unknown unless documented. Local receipt is recorded separately. No live government connection.</p>
    {!query.data?.length && <p>No source versions have been imported.</p>}
    <div className="source-cards">{query.data?.map(s => <article className="panel source-card" key={s.id}>
      <h3>{s.title}</h3><p>{s.issuer}</p><b>{s.state} · Version {s.version}</b>
      <p>{s.filename} · {s.page_count} pages</p>
      <p>Original retrieval: {s.retrieved_at ?? "Unknown"}<br />Local receipt: {s.received_at}</p>
      <p>Publication: {s.published_on ?? "Unknown"} · Effective: {s.effective_on ?? "Unknown"}</p>
      <p style={{overflowWrap:"anywhere"}}>SHA-256: {s.sha256}</p>
      <p>{s.provenance_note}</p>
      {s.canonical_url ? <a href={s.canonical_url} target="_blank" rel="noreferrer">Source URL</a> : <p>Canonical source URL unknown</p>}
      {s.conflict_note && <p role="note"><strong>Unresolved conflict:</strong> {s.conflict_note}</p>}
      <button className="btn secondary" onClick={() => {setSelected(s.id); setPage(1);}}>Inspect version {s.version}: {s.source_key}</button>
    </article>)}</div>
    {source && <section className="panel">
      <h2>Review {source.title} — version {source.version}</h2>
      <button className="btn secondary" onClick={() => {setDownloadError(""); void registryApi.download(source.id).catch(() => setDownloadError("PDF download failed; try again."));}}>Download captured PDF</button>
      {downloadError && <p role="alert">{downloadError}</p>}
      <label>Page <input type="number" min={1} max={source.page_count} value={page} onChange={e => setPage(Math.max(1, Math.min(source.page_count, Number(e.target.value) || 1)))} /></label>
      {passage.isError ? <p role="alert">Page evidence could not be loaded.</p> : <pre style={{whiteSpace:"pre-wrap"}}>{passage.data?.text || "No extracted text available; inspect the original PDF."}</pre>}
      <p>Review note: {source.review_note ?? "Not reviewed"}</p>
      {(role === "admin" || role === "officer") && <RegistryReview kind="source" record={source} onSaved={() => void query.refetch()} />}
    </section>}
  </>;
}
