import React from "react";
import { BadgePercent, ExternalLink, FileSearch, ShieldAlert } from "lucide-react";

const SOURCES = [
  { name: "Department of Animal Husbandry & Dairying", detail: "Official central-government scheme and programme discovery. Scheme eligibility, current availability, and benefit amounts are not reproduced until the current source documents are checked.", url: "https://dahd.gov.in/" },
  { name: "National Dairy Development Board", detail: "Official dairy-sector statistics and programme references. A published reference is not by itself proof that a funding window is currently open.", url: "https://www.nddb.coop/" },
  { name: "NABARD", detail: "Official programme and finance information. Loan terms and subsidy claims must be verified against the current scheme circular and applicant category.", url: "https://www.nabard.org/" },
  { name: "Tamil Nadu Government — Dairy Development Policy Note 2025–26", detail: "The policy note is a source document for state dairy context. It should not be treated as proof that a named subsidy or benefit is currently available without the applicable scheme order.", url: "https://cms.tn.gov.in/cms_migrated/document/docfiles/dairy_e_pn_2025_26.pdf" },
];

export function SchemesPage(): JSX.Element {
  return <main className="page-content fade-in">
    <header className="page-heading">
      <div className="eyebrow"><BadgePercent size={15} /> Official programme references</div>
      <h1>Government dairy schemes</h1>
      <p>Find official scheme publishers. Benefits, amounts, eligibility, and application status are shown only after the current scheme document is ingested and reviewed.</p>
    </header>
    <section className="source-integrity-banner">
      <div className="source-integrity-icon"><ShieldAlert size={21} /></div>
      <div><b>No unverified benefit claims</b><p>Previously displayed subsidy amounts, interest rates, franchise margins, and eligibility descriptions were not sufficiently verified against current scheme orders. Those claims have been removed. This page is a source directory until the source documents are parsed and reviewed.</p></div>
    </section>
    <section className="brand-source-grid">
      {SOURCES.map((source) => <article className="brand-source-card" key={source.name}>
        <div className="brand-source-top"><span className="brand-source-mark"><FileSearch size={20} /></span><span className="source-status-pill">Official source</span></div>
        <h2>{source.name}</h2><p className="brand-source-detail">{source.detail}</p>
        <div className="brand-source-links"><a href={source.url} target="_blank" rel="noreferrer">Open source <ExternalLink size={14} /></a></div>
        <div className="brand-source-footnote">Scheme ingestion and review pending</div>
      </article>)}
    </section>
  </main>;
}
