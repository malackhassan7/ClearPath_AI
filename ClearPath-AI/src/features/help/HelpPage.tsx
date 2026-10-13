import { useState } from "react";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { BookOpen, ExternalLink, Plus, ShieldCheck, X } from "lucide-react";

export function HelpPage() {
  const [open, setOpen] = useState(0);
  const faqs = [
    [
      "What is ClearPath-TN?",
      "An academic decision-support prototype that organizes fictional project, clearance, document, and workflow records to explain possible readiness blockers.",
    ],
    [
      "Does this connect to the Tamil Nadu Single Window Portal?",
      "No. This package runs in local demo mode and does not access TNSWP or submit applications. A future backend would need approved integration and credentials.",
    ],
    [
      "Are clearance requirements authoritative?",
      "No. Rule sketches and dependencies are illustrative. Verify exact requirements against current official Acts, Government Orders, Gazette notifications, and the responsible department.",
    ],
    [
      "Can I upload real business documents?",
      "No. Use safe fictional samples only. Never upload real Aadhaar, PAN, bank passbooks, signatures, or other personal or sensitive information. Selected files remain local in this prototype.",
    ],
    [
      "How are bottlenecks identified?",
      "The demo compares seeded pending-day values with illustrative SLA values and highlights query, blocked, or awaiting-applicant statuses. It avoids claiming a delay where the timeline is unavailable.",
    ],
    [
      "What is needed for production?",
      "A secure FastAPI backend, verified source registry, real authentication and server-side RBAC, storage controls, OCR validation, audit ledger, official integrations, privacy/security review, and automated tests.",
    ],
  ];
  return (
    <>
      <PageHeader
        eyebrow="HELP & GOVERNANCE"
        title="Guidance & FAQ"
        subtitle="Learn how to interpret readiness, rule citations, demo boundaries, and the path to a live service."
      />
      <div className="help-layout">
        <section className="panel faq-panel">
          <SectionTitle
            title="Frequently asked questions"
            sub="Select a question to read the answer"
          />
          {faqs.map(([q, a], i) => (
            <div className={`faq-item ${open === i ? "open" : ""}`} key={q}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span>{q}</span>
                {open === i ? <X size={16} /> : <Plus size={16} />}
              </button>
              {open === i && <p>{a}</p>}
            </div>
          ))}
        </section>
        <aside className="help-aside">
          <div className="panel">
            <span className="aside-icon">
              <ShieldCheck size={19} />
            </span>
            <h3>Important disclaimer</h3>
            <p>
              Academic decision-support prototype. Not officially affiliated
              with Tamil Nadu Government portals. Clearances must be confirmed
              with respective departments.
            </p>
            <a href="https://www.tnswp.com/" target="_blank" rel="noreferrer">
              TNSWP portal <ExternalLink size={14} />
            </a>
          </div>
          <div className="panel">
            <span className="aside-icon">
              <BookOpen size={19} />
            </span>
            <h3>Production checklist</h3>
            <ul>
              <li>Verified legal/source registry</li>
              <li>Backend identity & role controls</li>
              <li>Secure document handling</li>
              <li>Auditable rule versioning</li>
              <li>Reviewed SLA definitions</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
