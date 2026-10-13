import type { PageProps } from "@/app/pageProps";
import { useState } from "react";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  ExternalLink,
  Factory,
  FileText,
  Landmark,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { officialSources } from "@/data/officialSources";
import { Readiness } from "@/components/domain/Readiness";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Clearance, DocumentRecord, Project } from "@/types";

export function Dashboard({
  role,
  projects,
  clearances,
  documents,
  onToast,
}: PageProps) {
  const [range, setRange] = useState("30 days");
  if (
    projects.length === 0 &&
    clearances.length === 0 &&
    documents.length === 0
  )
    return (
      <>
        <PageHeader
          eyebrow="PUBLIC EVIDENCE WORKSPACE"
          title="ClearPath-TN source intelligence"
          subtitle="No fictional projects, clearances, document statuses, or readiness scores are preloaded. Start from official public sources and add only records you can substantiate."
          actions={
            <Link className="btn primary" to="/admin/sources">
              <BookOpen size={16} /> Explore verified sources
            </Link>
          }
        />
        <div className="screening-note">
          <ShieldCheck size={18} />
          <div>
            <b>Real-source mode · no operational feed connected</b>
            <p>
              Official reference links are available below. Private application
              status, document contents, and department processing events are
              not imported. ClearPath-TN will not invent a status, readiness
              score, or delay estimate when evidence is unavailable.
            </p>
          </div>
        </div>
        <div className="metric-grid">
          <StatCard
            label="Project records"
            value="0"
            icon={Factory}
            hint="No sample projects loaded"
          />
          <StatCard
            label="Clearance records"
            value="0"
            icon={ClipboardCheck}
            hint="No synthetic statuses"
            tone="blue"
          />
          <StatCard
            label="Document records"
            value="0"
            icon={FileText}
            hint="No fake document metadata"
            tone="amber"
          />
          <StatCard
            label="Live connections"
            value="0"
            icon={Activity}
            hint="Authorised API not configured"
            tone="rose"
          />
        </div>
        <div className="dashboard-grid">
          <section className="panel">
            <SectionTitle
              title="Start with official sources"
              sub="Public reference sources; open each source to verify current content"
            />
            <div className="source-quick-list">
              {officialSources
                .filter((x) =>
                  [
                    "tnswp",
                    "tnpcb-industrial-forms",
                    "tnpcb-consent-orders",
                    "nsws",
                  ].includes(x.id),
                )
                .map((x) => (
                  <div className="attention-item" key={x.id}>
                    <span className="attention-icon green">
                      <Landmark size={17} />
                    </span>
                    <div>
                      <b>{x.title}</b>
                      <p>{x.publisher}</p>
                      <small>{x.purpose}</small>
                    </div>
                    <a
                      href={x.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${x.title}`}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                ))}
            </div>
            <div className="panel-foot">
              <Link to="/admin/sources">
                Open full source registry <ArrowRight size={14} />
              </Link>
            </div>
          </section>
          <section className="panel">
            <SectionTitle
              title="Data readiness"
              sub="What can and cannot be used right now"
            />
            <div className="attention-list">
              <div className="attention-item">
                <span className="attention-icon green">
                  <CheckCircle2 size={17} />
                </span>
                <div>
                  <b>Public reference documents</b>
                  <p>Available for manual verification</p>
                  <small>Store document version, page, and checked date.</small>
                </div>
              </div>
              <div className="attention-item">
                <span className="attention-icon amber">
                  <AlertCircle size={17} />
                </span>
                <div>
                  <b>Private application tracking</b>
                  <p>Not connected</p>
                  <small>
                    Requires authorised access or a supported public feed.
                  </small>
                </div>
              </div>
              <div className="attention-item">
                <span className="attention-icon amber">
                  <Clock3 size={17} />
                </span>
                <div>
                  <b>Delay predictions</b>
                  <p>Unavailable without real event timestamps</p>
                  <small>
                    No estimated bottleneck is shown without evidence.
                  </small>
                </div>
              </div>
            </div>
            <Link className="panel-foot-link" to="/help">
              Read data governance and limitations <ArrowRight size={14} />
            </Link>
          </section>
        </div>
        <div className="source-note">
          <ShieldCheck size={16} />
          <div>
            <b>Source provenance is mandatory</b>
            <p>
              Only use a rule after recording its official URL, exact
              section/page, effective date, retrieval date, and reviewer. Public
              portal statistics must be labelled with their published update
              timestamp.
            </p>
          </div>
        </div>
      </>
    );
  const pending = clearances.filter(
    (c: Clearance) => !["approved", "not_applicable"].includes(c.status),
  );
  const delayed = clearances.filter(
    (c: Clearance) => c.delayStatus === "delayed",
  );
  const missing = documents.filter(
    (d: DocumentRecord) =>
      d.status === "not_uploaded" || d.status === "needs_correction",
  );
  const avg = Math.round(
    projects.reduce((s: number, p: Project) => s + (p.readinessScore ?? 50), 0) /
      Math.max(projects.length, 1),
  );
  return (
    <>
      <PageHeader
        eyebrow="YOUR READINESS AT A GLANCE"
        title={
          role === "officer"
            ? "Review command centre"
            : role === "consultant"
              ? "Client portfolio overview"
              : role === "admin"
                ? "System overview"
                : "Good morning, Arun"
        }
        subtitle={
          role === "applicant"
            ? "Here is the current picture of your industrial clearance journey."
            : role === "consultant"
              ? "Monitor client readiness, pending clearances, and where intervention matters most."
              : "Prioritize the reviews and workflow exceptions that need attention today."
        }
        actions={
          <>
            <button className="btn secondary" onClick={() => window.print()}>
              <Download size={16} /> Export overview
            </button>
            <Link className="btn primary" to="/projects/new">
              <Plus size={17} /> New project
            </Link>
          </>
        }
      />
      <div className="welcome-strip">
        <div className="welcome-symbol">
          <Sparkles size={20} />
        </div>
        <div>
          <b>
            {role === "officer"
              ? "Today’s review focus"
              : role === "consultant"
                ? "Portfolio pulse"
                : "Your next best action"}
          </b>
          <p>
            {role === "officer"
              ? `${pending.length} clearances remain active; ${delayed.length} are beyond their illustrative SLA window.`
              : role === "consultant"
                ? `${projects.length} demo clients/projects are tracked. ${missing.length} document items need attention.`
                : `Resolve the building-plan query to unblock downstream factory-plan review for Demo Precision Foods.`}
          </p>
        </div>
        <Link
          to={
            role === "officer"
              ? "/admin/review-queue"
              : role === "consultant"
                ? "/clients"
                : "/projects/p1/clearances"
          }
        >
          View recommendation <ArrowRight size={16} />
        </Link>
      </div>
      <div className="metric-grid">
        <StatCard
          label="Tracked projects"
          value={projects.length.toString().padStart(2, "0")}
          delta="2 updated this week"
          icon={Factory}
          hint="Across demo organizations"
        />
        <StatCard
          label="Average readiness"
          value={`${avg}%`}
          delta="+6 pts this month"
          icon={Activity}
          hint="Rule-based demo estimate"
          tone="blue"
        />
        <StatCard
          label="Active clearances"
          value={pending.length.toString().padStart(2, "0")}
          icon={ClipboardCheck}
          hint="Require action or review"
          tone="amber"
        />
        <StatCard
          label="Workflow bottlenecks"
          value={delayed.length.toString().padStart(2, "0")}
          icon={AlertTriangle}
          hint="Illustrative SLA comparison"
          tone="rose"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel project-panel">
          <SectionTitle
            title="Project readiness"
            sub="Your active industrial projects"
            action={
              <Link className="text-link" to="/projects">
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>PROJECT</th>
                  <th>LOCATION</th>
                  <th>STAGE</th>
                  <th>READINESS</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 4).map((p: Project) => (
                  <tr key={p.id}>
                    <td>
                      <Link className="project-cell" to={`/projects/${p.id}`}>
                        <span className="project-icon">
                          <Factory size={17} />
                        </span>
                        <span>
                          <b>{p.name}</b>
                          <small>{p.code}</small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <span className="location">
                        <MapPin size={13} />
                        {p.district}
                      </span>
                    </td>
                    <td>
                      <span className="stage-tag">{p.stage}</span>
                    </td>
                    <td>
                      <Readiness value={p.readinessScore ?? 50} />
                    </td>
                    <td>
                      <StatusBadge
                        status={
                          (p.readinessScore ?? 50) >= 85
                            ? "approved"
                            : (p.readinessScore ?? 50) >= 65
                              ? "under_review"
                              : "query_raised"
                        }
                      />
                    </td>
                    <td>
                      <Link
                        to={`/projects/${p.id}`}
                        className="table-arrow"
                        aria-label={`Open ${p.name}`}
                      >
                        <ChevronRight size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-foot">
            <span>
              Showing {Math.min(4, projects.length)} of {projects.length}{" "}
              projects
            </span>
            <Link to="/projects">
              Open project registry <ArrowRight size={14} />
            </Link>
          </div>
        </section>
        <section className="panel bottleneck-panel">
          <SectionTitle
            title="Needs your attention"
            sub="Prioritized from demo workflow evidence"
            action={
              <span className="count-badge">
                {missing.length + delayed.length}
              </span>
            }
          />
          <div className="attention-list">
            {missing.slice(0, 2).map((d: DocumentRecord) => (
              <div className="attention-item" key={d.id}>
                <span className="attention-icon amber">
                  <FileText size={17} />
                </span>
                <div>
                  <b>{d.documentName}</b>
                  <p>{d.projectName}</p>
                  <small>
                    {d.status === "not_uploaded"
                      ? "Required document not supplied"
                      : "Correction requested"}
                  </small>
                </div>
                <Link
                  to={`/projects/${d.projectId}/documents`}
                  aria-label="Review document"
                >
                  <ChevronRight size={17} />
                </Link>
              </div>
            ))}
            {delayed.slice(0, 2).map((c: Clearance) => (
              <div className="attention-item" key={c.id}>
                <span className="attention-icon rose">
                  <Clock3 size={17} />
                </span>
                <div>
                  <b>{c.name}</b>
                  <p>{c.projectName}</p>
                  <small>
                    {c.slaDays === null
                      ? "Timeline unavailable"
                      : `${c.pendingDays - c.slaDays} days beyond illustrative SLA`}
                  </small>
                </div>
                <Link
                  to={`/projects/${c.projectId}/clearances`}
                  aria-label="Review clearance"
                >
                  <ChevronRight size={17} />
                </Link>
              </div>
            ))}
            {!missing.length && !delayed.length && (
              <EmptyState
                title="No urgent items"
                body="There are no current demo alerts to show."
              />
            )}
          </div>
          <Link className="panel-foot-link" to="/bottlenecks">
            Explore bottleneck insights <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <div className="dashboard-grid lower-grid">
        <section className="panel">
          <SectionTitle
            title="Clearance progress"
            sub="Current state across all simulated clearances"
            action={
              <select
                className="small-select"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                <option>30 days</option>
                <option>90 days</option>
                <option>12 months</option>
              </select>
            }
          />
          <div className="progress-overview">
            <div
              className="donut"
              style={{
                background: `conic-gradient(#2d6a4f 0 42%, #dca34c 42% 68%, #e8e7df 68% 100%)`,
              }}
            >
              <div>
                <b>{clearances.length}</b>
                <small>clearances</small>
              </div>
            </div>
            <div className="progress-legend">
              <div>
                <span className="legend-dot green-dot" />
                <div>
                  <b>
                    {
                      clearances.filter(
                        (c: Clearance) => c.status === "approved",
                      ).length
                    }{" "}
                    Approved
                  </b>
                  <small>Recorded as complete</small>
                </div>
              </div>
              <div>
                <span className="legend-dot amber-dot" />
                <div>
                  <b>
                    {
                      clearances.filter((c: Clearance) =>
                        [
                          "under_review",
                          "applied",
                          "awaiting_applicant",
                          "query_raised",
                        ].includes(c.status),
                      ).length
                    }{" "}
                    In progress
                  </b>
                  <small>With applicant or authority</small>
                </div>
              </div>
              <div>
                <span className="legend-dot gray-dot" />
                <div>
                  <b>
                    {
                      clearances.filter((c: Clearance) =>
                        [
                          "blocked",
                          "not_started",
                          "potentially_applicable",
                        ].includes(c.status),
                      ).length
                    }{" "}
                    Needs action
                  </b>
                  <small>Prerequisites or applicability</small>
                </div>
              </div>
            </div>
          </div>
          <div className="muted-note">
            <AlertCircle size={14} /> {range} view uses seeded demo records, not
            live portal data.
          </div>
        </section>
        <section className="panel">
          <SectionTitle
            title="Workflow snapshot"
            sub="Typical readiness journey"
            action={
              <Link className="text-link" to="/workflow">
                Open map <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="mini-timeline">
            <div className="timeline-step done">
              <span>
                <Check size={15} />
              </span>
              <div>
                <b>Project particulars</b>
                <small>Business and site profile captured</small>
              </div>
              <StatusBadge status="approved" />
            </div>
            <div className="timeline-step done">
              <span>
                <Check size={15} />
              </span>
              <div>
                <b>Applicability screening</b>
                <small>Potential requirements identified</small>
              </div>
              <StatusBadge status="approved" />
            </div>
            <div className="timeline-step current">
              <span>3</span>
              <div>
                <b>Documents & applications</b>
                <small>Correct queried documents</small>
              </div>
              <StatusBadge status="query_raised" />
            </div>
            <div className="timeline-step">
              <span>4</span>
              <div>
                <b>Authority review</b>
                <small>Department decisions and follow-up</small>
              </div>
              <StatusBadge status="not_started" />
            </div>
          </div>
        </section>
      </div>
      <div className="source-note">
        <ShieldCheck size={16} />
        <div>
          <b>How to read these signals</b>
          <p>
            Readiness scores and timelines are simulated for demonstration. They
            are not statutory decisions or official processing-time commitments.
          </p>
        </div>
        <Link to="/admin/rules">
          View rule notes <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}
