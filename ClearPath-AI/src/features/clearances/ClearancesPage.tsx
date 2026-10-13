import type { PageProps } from "@/app/pageProps";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  Search,
} from "lucide-react";
import { StatusBadge, statusMeta } from "@/components/ui/StatusBadge";
import { Link } from "react-router-dom";
import { Readiness } from "@/components/domain/Readiness";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Clearance, Project } from "@/types";

export function ClearancesPage({
  clearances,
  projects,
  projectId,
  role,
  onUpdateClearance,
}: PageProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [dept, setDept] = useState("All departments");
  const cs = clearances.filter(
    (c: Clearance) =>
      (!projectId || c.projectId === projectId) &&
      `${c.name} ${c.department} ${c.projectName} ${c.shortCode}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (status === "All statuses" || c.status === status) &&
      (dept === "All departments" || c.department === dept),
  );
  const p = projects.find((x: Project) => x.id === projectId);
  return (
    <>
      <PageHeader
        eyebrow="CLEARANCE TRACKER"
        title={p ? `${p.name} — clearances` : "Clearance registry"}
        subtitle="Track status, evidence, dependencies, and next actions without obscuring the reasoning."
      />
      <div className="metric-grid compact-metrics">
        <StatCard
          label="Tracked items"
          value={cs.length}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Approved"
          value={cs.filter((c: Clearance) => c.status === "approved").length}
          icon={CheckCircle2}
          tone="blue"
        />
        <StatCard
          label="Queries / applicant action"
          value={
            cs.filter((c: Clearance) =>
              ["query_raised", "awaiting_applicant"].includes(c.status),
            ).length
          }
          icon={AlertCircle}
          tone="amber"
        />
        <StatCard
          label="Beyond demo SLA"
          value={
            cs.filter((c: Clearance) => c.delayStatus === "delayed").length
          }
          icon={Clock3}
          tone="rose"
        />
      </div>
      <section className="panel data-panel">
        <div className="filter-row">
          <div className="search-field">
            <Search size={17} />
            <input
              placeholder="Search clearance, department or project…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>All statuses</option>
            {Object.keys(statusMeta)
              .filter((x) =>
                [
                  "approved",
                  "under_review",
                  "query_raised",
                  "awaiting_applicant",
                  "ready_to_apply",
                  "not_started",
                  "potentially_applicable",
                  "blocked",
                  "rejected",
                  "applied",
                  "needs_authority_review",
                  "not_applicable",
                ].includes(x),
              )
              .map((x) => (
                <option value={x} key={x}>
                  {statusMeta[x].label}
                </option>
              ))}
          </select>
          <select
            className="form-select"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option>All departments</option>
            {[...new Set(clearances.map((c: Clearance) => c.department))].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>CLEARANCE</th>
                <th>PROJECT</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
                <th>PENDING</th>
                <th>DOCUMENT READY</th>
                <th>NEXT ACTION</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cs.map((c: Clearance) => (
                <tr key={c.id}>
                  <td>
                    <div className="cell-title">
                      <b>{c.name}</b>
                      <small>{c.shortCode}</small>
                    </div>
                  </td>
                  <td>
                    <Link
                      className="table-link"
                      to={`/projects/${c.projectId}`}
                    >
                      {c.projectName}
                    </Link>
                  </td>
                  <td>{c.department}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>
                    <b>{c.slaDays === null ? "—" : `${c.pendingDays} d`}</b>
                    <small
                      className={
                        c.delayStatus === "delayed" ? "text-danger" : "cell-sub"
                      }
                    >
                      {c.delayStatus === "timeline_unavailable"
                        ? "Timeline unavailable"
                        : c.delayStatus === "delayed"
                          ? `${c.pendingDays - c.slaDays!} d over demo SLA`
                          : c.delayStatus === "approaching_deadline"
                            ? "Approaching demo SLA"
                            : "Within demo SLA"}
                    </small>
                  </td>
                  <td>
                    <Readiness value={c.documentReadinessPercent} />
                  </td>
                  <td className="next-action-cell">{c.nextAction}</td>
                  <td>
                    <Link
                      className="table-arrow"
                      to={`/clearances/${c.id}`}
                      aria-label="View clearance"
                    >
                      <ChevronRight size={17} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cs.length === 0 && (
          <EmptyState
            title="No matching clearances"
            body="Try clearing the selected filters."
          />
        )}
        <div className="panel-foot">
          <span>
            Demo records · Timelines are illustrative, not official SLAs.
          </span>
          <button className="text-link" onClick={() => window.print()}>
            Print matrix <Download size={14} />
          </button>
        </div>
      </section>
      <div className="source-note">
        <BookOpen size={16} />
        <div>
          <b>Explainability note</b>
          <p>
            Every rule reference here is illustrative and may require authority
            confirmation. It is not a verified determination of legal
            applicability.
          </p>
        </div>
        <Link to="/admin/rules">
          Review rule sources <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}
