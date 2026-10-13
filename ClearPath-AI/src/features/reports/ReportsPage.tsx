import type { PageProps } from "@/app/pageProps";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  Landmark,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Clearance, DocumentRecord, Project } from "@/types";

export function ReportsPage({
  projects,
  clearances,
  documents,
  projectId,
  onToast,
}: PageProps) {
  const [selected, setSelected] = useState(projectId || projects[0]?.id || "");
  const [includeDocs, setIncludeDocs] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const p = projects.find((x: Project) => x.id === selected) || projects[0];
  const cs = clearances.filter((c: Clearance) => c.projectId === selected);
  const ds = documents.filter((d: DocumentRecord) => d.projectId === selected);
  const missing = ds.filter((d: DocumentRecord) =>
    ["not_uploaded", "needs_correction"].includes(d.status),
  );
  return (
    <>
      <PageHeader
        eyebrow="REPORT BUILDER"
        title="Readiness reports"
        subtitle="Create a print-friendly evidence summary of readiness, outstanding actions, and known limitations."
        actions={
          <button className="btn primary" onClick={() => window.print()}>
            <Download size={16} /> Print / save PDF
          </button>
        }
      />
      <div className="report-layout">
        <section className="panel report-controls">
          <div className="eyebrow">REPORT CONFIGURATION</div>
          <h3>Build your report</h3>
          <p>
            Choose a project and the sections to include in the local preview.
          </p>
          <label>Industrial project</label>
          <select
            className="form-control"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {projects.map((x: Project) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <label className="check-line">
            <input
              type="checkbox"
              checked={includeDocs}
              onChange={(e) => setIncludeDocs(e.target.checked)}
            />{" "}
            Include missing-document checklist
          </label>
          <label className="check-line">
            <input
              type="checkbox"
              checked={includeTimeline}
              onChange={(e) => setIncludeTimeline(e.target.checked)}
            />{" "}
            Include workflow and timeline caveats
          </label>
          <div className="report-types">
            <b>Report sections</b>
            <div>
              <CheckCircle2 size={15} /> Executive readiness summary
            </div>
            <div>
              <CheckCircle2 size={15} /> Clearance matrix and next steps
            </div>
            {includeDocs && (
              <div>
                <CheckCircle2 size={15} /> Document gaps and status
              </div>
            )}
            {includeTimeline && (
              <div>
                <CheckCircle2 size={15} /> Bottleneck evidence and caveats
              </div>
            )}
          </div>
          <button
            className="btn primary full"
            onClick={() =>
              onToast("Report preview refreshed from current demo data")
            }
          >
            Refresh preview <RefreshCw size={15} />
          </button>
        </section>
        <section className="report-preview">
          <div className="preview-toolbar">
            <span>
              <Eye size={15} /> LIVE PREVIEW
            </span>
            <span>CP-TN · DEMO REPORT</span>
          </div>
          <div className="report-paper">
            <div className="report-brand">
              <div className="brand-mark">
                <Landmark size={20} />
              </div>
              <div>
                <b>ClearPath-TN</b>
                <small>INDUSTRIAL READINESS REPORT</small>
              </div>
              <span>DEMO</span>
            </div>
            <div className="report-rule" />
            <div className="eyebrow">PROJECT READINESS SUMMARY</div>
            <h2>{p?.name}</h2>
            <p className="report-sub">
              {p?.organizationName} · {p?.district}, Tamil Nadu · {p?.code}
            </p>
            <div className="report-score">
              <div
                className="score-ring small-ring"
                style={{
                  background: `conic-gradient(#2d6a4f ${p?.readinessScore || 0}%, #e8e7df 0)`,
                }}
              >
                <div>
                  <b>{p?.readinessScore}%</b>
                </div>
              </div>
              <div>
                <b>
                  {(p?.readinessScore ?? 0) >= 85
                    ? "Near-ready"
                    : (p?.readinessScore ?? 0) >= 65
                      ? "Progressing"
                      : "Early stage"}
                </b>
                <p>Simulated readiness estimate; not a clearance decision.</p>
              </div>
            </div>
            <div className="report-stats">
              <div>
                <small>Tracked clearances</small>
                <b>{cs.length}</b>
              </div>
              <div>
                <small>Approved (demo)</small>
                <b>
                  {cs.filter((c: Clearance) => c.status === "approved").length}
                </b>
              </div>
              <div>
                <small>Open actions</small>
                <b>
                  {
                    cs.filter(
                      (c: Clearance) =>
                        !["approved", "not_applicable"].includes(c.status),
                    ).length
                  }
                </b>
              </div>
            </div>
            <h3>Clearance summary</h3>
            <div className="report-clearances">
              {cs.map((c: Clearance) => (
                <div key={c.id}>
                  <span>
                    <b>{c.name}</b>
                    <small>{c.department}</small>
                  </span>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
            {includeDocs && (
              <>
                <h3>Document gaps</h3>
                {missing.length ? (
                  missing.map((d: DocumentRecord) => (
                    <div className="report-gap" key={d.id}>
                      <AlertCircle size={15} />
                      <span>
                        <b>{d.documentName}</b>
                        <small>{d.validationNote}</small>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="report-sub">
                    No document gaps in the selected demo records.
                  </p>
                )}
              </>
            )}
            {includeTimeline && (
              <>
                <h3>Workflow / timeline caveats</h3>
                <p className="report-sub">
                  The workflow contains illustrative dependencies.{" "}
                  {
                    cs.filter(
                      (c: Clearance) =>
                        c.delayStatus === "timeline_unavailable",
                    ).length
                  }{" "}
                  clearance(s) have no verified timeline. All other pending-day
                  comparisons use sample values, not official commitments.
                </p>
              </>
            )}
            <div className="report-disclaimer">
              <ShieldCheck size={15} />
              <span>
                Academic decision-support prototype. Not affiliated with Tamil
                Nadu Government portals. All records and rule mappings are
                simulated. Verify every requirement with the relevant authority.
              </span>
            </div>
            <div className="report-signature">
              <span>
                Generated locally · {new Date().toLocaleDateString("en-IN")}
              </span>
              <span>Source: Demo data</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
