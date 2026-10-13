import React from "react";
import { AlertTriangle, ExternalLink, FileSearch, ShieldCheck, Tag } from "lucide-react";

type SourceCard = { name: string; kind: string; status: string; detail: string; links: { label: string; url: string }[] };
const SOURCES: SourceCard[] = [
  { name: "Aavin (TCMPF)", kind: "Cooperative", status: "Primary documents identified · terms not yet extracted", detail: "The official FRO application and parlour-guideline PDFs are the primary sources for any Aavin-specific deposit, premises, electrical, margin, and document requirements. No amounts are shown until each value is extracted from the document and checked with a page reference.", links: [
    { label: "FRO application PDF", url: "https://aavin.tn.gov.in/documents/20142/59228/Applcation+for+AAVIN+FRO.pdf" },
    { label: "Parlour guidelines PDF", url: "https://aavin.tn.gov.in/documents/20142/315607/Aavin+Parlour_NEW_Final.pdf" },
  ] },
  { name: "Dodla Dairy", kind: "Private company", status: "Terms not publicly verified", detail: "No franchise deposit, shop-space requirement, power requirement, or trade margin is asserted. Contact the company for current written terms and attach the response as evidence before comparison.", links: [ { label: "Official company website", url: "https://www.dodladairy.com/" } ] },
  { name: "Hatsun Agro Product", kind: "Private company", status: "Terms not publicly verified", detail: "No franchise deposit, shop-space requirement, power requirement, or trade margin is asserted. Contact the company for current written terms and attach the response as evidence before comparison.", links: [ { label: "Official company website", url: "https://www.hap.in/" } ] },
];

export function BrandComparison(): JSX.Element {
  return (
    <main className="page-content fade-in">
      <header className="page-heading">
        <div className="eyebrow"><Tag size={15} /> Market intelligence & brand benchmarking</div>
        <h1>Dairy brand comparison</h1>
        <p>Compare only documented, source-backed requirements. Values that have not been verified are intentionally withheld rather than estimated.</p>
      </header>
      <section className="source-integrity-banner">
        <div className="source-integrity-icon"><AlertTriangle size={21} /></div>
        <div><b>Evidence-first comparison</b><p>Earlier displayed deposits, premises sizes, power requirements, margins, and checklists were not adequately supported by page-level evidence. They have been removed. An official website link alone is not proof of a particular commercial term.</p></div>
      </section>
      <section className="brand-source-grid">
        {SOURCES.map((source) => (
          <article className="brand-source-card" key={source.name}>
            <div className="brand-source-top"><span className="brand-source-mark"><ShieldCheck size={20} /></span><span className="source-status-pill">{source.kind}</span></div>
            <h2>{source.name}</h2>
            <p className="brand-source-status">{source.status}</p>
            <p className="brand-source-detail">{source.detail}</p>
            <div className="brand-source-links">{source.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}<ExternalLink size={14} /></a>)}</div>
            <div className="brand-source-footnote"><FileSearch size={15} /> Source extraction and review pending</div>
          </article>
        ))}
      </section>
    </main>
  );
}
