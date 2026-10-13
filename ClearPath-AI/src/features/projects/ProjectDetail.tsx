import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { PageProps } from "@/app/pageProps";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileBarChart,
  Files,
  FileText,
  GitBranch,
  MapPin,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { money } from "@/lib/format";
import type { Clearance, DocumentRecord, Project } from "@/types";
import { STATUTORY_TEMPLATES, type StatutoryTemplate } from "@/data/statutoryTemplates";
import { TemplateModal } from "@/components/ui/TemplateModal";

export function ProjectDetail({
  projects,
  clearances,
  documents,
  projectId,
}: PageProps) {
  const [activeTemplate, setActiveTemplate] = useState<StatutoryTemplate | null>(null);
  const p = projects.find((x: Project) => x.id === projectId) || projects[0];
  const cs = clearances.filter((c: Clearance) => c.projectId === p.id);
  const ds = documents.filter((d: DocumentRecord) => d.projectId === p.id);

  const capacity = p.capacity_lpd || (p.investmentInrLakhs ? p.investmentInrLakhs * 100 : 2000);
  const turnoverLakhs = p.annual_turnover ? p.annual_turnover / 100000 : (p.investmentInrLakhs ? p.investmentInrLakhs * 2 : 50);
  const isCentral = capacity > 50000 || turnoverLakhs > 2000;
  const isState = !isCentral && (capacity > 500 || turnoverLakhs > 12);
  const fssaiTier = isCentral ? "Central License" : isState ? "State License" : "Registration (Form A)";
  return (
    <>
      <PageHeader
        eyebrow={`PROJECT · ${p.code}`}
        title={p.name}
        subtitle={`${p.organizationName} · ${p.district}, Tamil Nadu`}
        actions={
          <>
            <Link className="btn secondary" to={`/projects/${p.id}/edit`}>
              Edit particulars
            </Link>
            <Link className="btn primary" to={`/projects/${p.id}/reports`}>
              <FileBarChart size={16} /> Readiness report
            </Link>
          </>
        }
      />
      <div className="project-hero">
        <div>
          <span className="stage-tag">{p.stage || "Planning"}</span>
          <span className={`industry-tag ${(p.industryCategory || "White").toLowerCase()}`}>
            {p.industryCategory || "Dairy"} industry
          </span>
          <h2>{p.organizationName || p.name}</h2>
          <p>
            <MapPin size={14} />
            {p.district}, Tamil Nadu <span>·</span>
            <BriefcaseBusiness size={14} />
            {p.enterpriseCategory || "MSME"} enterprise
          </p>
        </div>
        <div className="hero-score">
          <div
            className="score-ring"
            style={{
              background: `conic-gradient(#2d6a4f ${p.readinessScore ?? 45}%, #e8e7df 0)`,
            }}
          >
            <div>
              <b>{p.readinessScore ?? 45}%</b>
              <small>readiness</small>
            </div>
          </div>
          <div>
            <b>
              {(p.readinessScore ?? 45) >= 85
                ? "Near-ready"
                : (p.readinessScore ?? 45) >= 65
                  ? "Progressing"
                  : "Early stage"}
            </b>
            <small>Demo rule estimate</small>
          </div>
        </div>
      </div>
      <div className="metric-grid">
        <StatCard
          label="Investment"
          value={money(p.investmentInrLakhs ?? 0)}
          icon={Activity}
        />
        <StatCard
          label="Employment"
          value={(p.employmentCount ?? 0).toLocaleString()}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Clearances tracked"
          value={cs.length}
          icon={ClipboardCheck}
          tone="amber"
        />
        <StatCard
          label="Documents needing action"
          value={
            ds.filter((d: DocumentRecord) =>
              ["not_uploaded", "needs_correction"].includes(d.status),
            ).length
          }
          icon={Files}
          tone="rose"
        />
      </div>
      <div className="quick-link-grid">
        {(
          [
            [
              "Clearance matrix",
              `${cs.length} requirements tracked`,
              "/clearances",
              ClipboardCheck,
            ],
            [
              "Document repository",
              `${ds.length} document records`,
              "/documents",
              Files,
            ],
            [
              "Workflow dependencies",
              "Stages, prerequisites and blockers",
              "/workflow",
              GitBranch,
            ],
            [
              "Bottleneck diagnostics",
              "Delay evidence and mitigations",
              "/bottlenecks",
              ChartNoAxesCombined,
            ],
          ] as [string, string, string, LucideIcon][]
        ).map(([t, s, path, I]) => (
          <Link
            to={
              path === "/clearances"
                ? `/projects/${p.id}/clearances`
                : path === "/documents"
                  ? `/projects/${p.id}/documents`
                  : path === "/workflow"
                    ? `/projects/${p.id}/workflow`
                    : `/projects/${p.id}/bottlenecks`
            }
            className="quick-link"
            key={t}
          >
            <span>
              <I size={19} />
            </span>
            <div>
              <b>{t}</b>
              <small>{s}</small>
            </div>
            <ArrowRight size={17} />
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <SectionTitle
            title="Next actions"
            sub="Ranked by their effect on the workflow"
          />
          <div className="action-list">
            <div>
              <span className="action-number">01</span>
              <div>
                <b>Resolve queried building-plan document</b>
                <p>
                  Downstream factory-plan review is shown as blocked by this
                  prerequisite in the demo.
                </p>
                <Link to={`/projects/${p.id}/documents`}>
                  Open document vault <ArrowRight size={13} />
                </Link>
              </div>
            </div>
            <div>
              <span className="action-number">02</span>
              <div>
                <b>Confirm clearance applicability</b>
                <p>
                  Use the source notes to verify which approvals apply to this
                  facility.
                </p>
                <Link to={`/projects/${p.id}/clearances`}>
                  Review clearance matrix <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="panel">
          <SectionTitle
            title="Project particulars"
            sub="Captured from the project profile"
          />
          <div className="detail-list">
            {[
              ["Industry category", p.industryCategory || "Dairy"],
              ["Enterprise size", p.enterpriseCategory || "MSME"],
              ["Investment", money(p.investmentInrLakhs ?? 0)],
              ["Estimated employment", `${p.employmentCount ?? 0} people`],
              ["Project stage", p.stage || "Planning"],
              ["Last updated", p.updatedAt || new Date().toISOString().slice(0, 10)],
            ].map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--teal-primary)" }}>MANDATORY STATUTORY CHECKLIST & TEMPLATES</div>
            <h2 style={{ fontSize: "18px", margin: "4px 0" }}>Statutory Compliance for {p.name}</h2>
            <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
              Calculated Tier: <b>{fssaiTier}</b> (Capacity: {capacity.toLocaleString()} LPD). Below are the required statutory documents and downloadable official formats.
            </p>
          </div>
          <Link to={`/projects/${p.id}/documents`} className="btn primary">
            <Upload size={15} /> Upload Documents
          </Link>
        </div>

        <div style={{ display: "grid", gap: "12px" }}>
          {STATUTORY_TEMPLATES.map((tmpl) => {
            const uploaded = ds.find((d) => d.documentName?.toLowerCase().includes(tmpl.templateKey.replace("template_", "").replace("_", " ")));
            return (
              <div
                key={tmpl.templateKey}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: uploaded ? "#f8fafc" : "#ffffff",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div
                    style={{
                      marginTop: "2px",
                      padding: "8px",
                      borderRadius: "6px",
                      background: uploaded ? "rgba(45,106,79,0.1)" : "rgba(100,116,139,0.1)",
                      color: uploaded ? "#2d6a4f" : "#64748b",
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <b style={{ fontSize: "14px", color: "#1e293b" }}>{tmpl.title}</b>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          background: uploaded ? "#dcfce7" : "#fee2e2",
                          color: uploaded ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {uploaded ? "Uploaded & Recorded" : "Pending Upload"}
                      </span>
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                      {tmpl.authority} · {tmpl.citation}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setActiveTemplate(tmpl)}
                    style={{ fontSize: "13px", padding: "6px 12px" }}
                  >
                    <Download size={14} /> View Template Format
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="source-note" style={{ marginTop: "24px" }}>
        <AlertCircle size={16} />
        <div>
          <b>Official Sourced Norms</b>
          <p>
            Checklist derived from FSSAI Food Safety and Standards Regulations (Licensing & Registration) 2011 and FoSCoS standard operating procedures.
          </p>
        </div>
      </div>

      {activeTemplate && (
        <TemplateModal
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
        />
      )}
    </>
  );
}
