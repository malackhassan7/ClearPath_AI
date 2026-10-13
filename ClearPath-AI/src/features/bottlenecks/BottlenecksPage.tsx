import type { PageProps } from "@/app/pageProps";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  ChevronRight,
  Clock3,
  Download,
  HelpCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Clearance } from "@/types";
import { useBottleneckRanking } from "@/api/tnswpHooks";
import { tnswpDataStatus, getTnswpRecords } from "@/lib/tnswp";

export function BottlenecksPage({
  clearances,
  projects,
  projectId,
  role,
}: PageProps) {
  const [sort, setSort] = useState("delay");
  const officialQuery = useBottleneckRanking();
  const officialRecords = getTnswpRecords();
  const officialRanked = officialQuery.data ?? [];
  const cs = clearances
    .filter(
      (c: Clearance) =>
        (!projectId || c.projectId === projectId) &&
        c.delayStatus !== "on_time" &&
        c.status !== "approved",
    )
    .sort((a: Clearance, b: Clearance) =>
      sort === "delay"
        ? b.pendingDays - (b.slaDays || 0) - (a.pendingDays - (a.slaDays || 0))
        : a.department.localeCompare(b.department),
    );
  const delayed = cs.filter((c: Clearance) => c.delayStatus === "delayed");
  return (
    <>
      <PageHeader
        eyebrow="BOTTLENECK INTELLIGENCE"
        title="Bottleneck & delay insights"
        subtitle="Trace delays to missing prerequisites, unresolved queries, document corrections, or timelines that are not available."
        actions={
          <button className="btn secondary" onClick={() => window.print()}>
            <Download size={16} /> Export analysis
          </button>
        }
      />
      <section className="panel data-panel" aria-labelledby="official-tnswp-heading">
        <div className="filter-row">
          <div>
            <h3 id="official-tnswp-heading">Official TNSWP service performance</h3>
            <p className="section-sub">Government dashboard snapshot · {tnswpDataStatus.recordCount} service records · Retrieved {tnswpDataStatus.retrievedOn}</p>
          </div>
          <a className="btn secondary" href={tnswpDataStatus.url} target="_blank" rel="noreferrer">Open official source</a>
        </div>
        <div className="screening-note">
          <AlertCircle size={18} />
          <div>
            <b>Source freshness note</b>
            <p>These are real values transcribed from the public dashboard snapshot, not a live API feed. The retrieved page footer reports 28-01-2025 as its last-updated date; verify the live portal before making operational decisions. Derived scores are ClearPath calculations, not government-issued ratings.</p>
          </div>
        </div>
        {officialQuery.isError && <div role="alert" className="screening-note"><AlertCircle size={18} /><div><b>Could not prepare the official ranking</b><p>Retry the calculation from the local source snapshot.</p><button className="btn secondary" onClick={() => void officialQuery.refetch()}>Retry</button></div></div>}
        <div className="table-scroll">
          <table>
            <thead><tr><th>OFFICIAL SERVICE</th><th>DEPARTMENT</th><th>PRESCRIBED</th><th>AVG. APPROVAL</th><th>DELAY RATIO</th><th>EXCESS DAYS</th><th>BOTTLENECK</th><th>REJECTION RATE</th></tr></thead>
            <tbody>
              {officialRanked.slice(0, 12).map((item) => {
                const record = officialRecords.find((candidate) => candidate.record_id === item.recordId);
                if (!record) return null;
                return <tr key={record.record_id}>
                  <td><div className="cell-title"><b>{record.service_name}</b><small>{record.record_id}</small></div></td>
                  <td>{record.department_name}</td>
                  <td>{record.prescribed_time_limit_days > 0 ? `${record.prescribed_time_limit_days} working days` : "Timeline unavailable"}</td>
                  <td>{record.average_approval_days === null ? "Data unavailable" : `${record.average_approval_days} days`}</td>
                  <td>{record.delay_ratio === null ? "—" : record.delay_ratio.toFixed(2)}</td>
                  <td>{record.delay_excess_days === null ? "—" : `${record.delay_excess_days.toFixed(1)} days`}</td>
                  <td><span className="status-pill" aria-label={`Bottleneck level: ${record.bottleneck_level}`}>{record.bottleneck_level}</span></td>
                  <td>{record.rejection_rate_pct === null ? "—" : `${record.rejection_rate_pct.toFixed(2)}%`}</td>
                </tr>;
              })}
              {officialRanked.length === 0 && <tr><td colSpan={8}>No calculable bottleneck records are available in this source snapshot.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="section-sub">Ranking uses delay ratio × ln(1 + applications received). Rows without a valid prescribed time limit are excluded from numeric ranking.</p>
      </section>
      <div className="metric-grid">
        <StatCard
          label="Potential bottlenecks"
          value={cs.length}
          icon={ChartNoAxesCombined}
          tone="amber"
          hint="Open demo workflow exceptions"
        />
        <StatCard
          label="Beyond illustrative SLA"
          value={delayed.length}
          icon={Clock3}
          tone="rose"
          hint="Not an official processing delay"
        />
        <StatCard
          label="Waiting for applicant"
          value={
            clearances.filter(
              (c: Clearance) =>
                c.status === "awaiting_applicant" ||
                c.status === "query_raised",
            ).length
          }
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="No verified timeline"
          value={
            clearances.filter(
              (c: Clearance) => c.delayStatus === "timeline_unavailable",
            ).length
          }
          icon={HelpCircle}
          hint="Do not infer a delay"
        />
      </div>
      <div className="screening-note">
        <AlertCircle size={18} />
        <div>
          <b>How the demo detects a bottleneck</b>
          <p>
            This separate section uses prototype project/workflow records and illustrative SLA values. It is not used in the official TNSWP service ranking above and must not be interpreted as real company application status.
          </p>
        </div>
      </div>
      <section className="panel data-panel">
        <div className="filter-row">
          <div>
            <h3>Illustrative workflow exceptions</h3>
            <p className="section-sub">Prototype records only — not official government data</p>
          </div>
          <select
            className="form-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="delay">Sort by delay</option>
            <option value="department">Sort by department</option>
          </select>
        </div>
        {cs.map((c: Clearance, i: number) => (
          <div className="bottleneck-row" key={c.id}>
            <div
              className={`bottleneck-rank ${c.delayStatus === "delayed" ? "danger-rank" : ""}`}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="bottleneck-main">
              <div className="bottleneck-title">
                <h4>{c.name}</h4>
                <StatusBadge status={c.status} />
              </div>
              <p>
                {c.projectName} <span>·</span> {c.department}
              </p>
              <div className="bottleneck-reason">
                <b>Observed signal</b>
                <span>
                  {c.status === "query_raised"
                    ? "Unresolved document / authority query"
                    : c.status === "blocked"
                      ? "Prerequisite dependency marked as blocked"
                      : c.status === "awaiting_applicant"
                        ? "Awaiting applicant response"
                        : c.delayStatus === "timeline_unavailable"
                          ? "No verified timeline supplied"
                          : "Pending duration exceeds illustrative SLA"}
                </span>
              </div>
              <div className="bottleneck-reason">
                <b>Recommended next step</b>
                <span>{c.nextAction}</span>
              </div>
              <div className="bottleneck-meta">
                <span>
                  <Clock3 size={13} />
                  {c.pendingDays} pending days
                </span>
                <span>
                  <Activity size={13} />
                  {c.slaDays === null
                    ? "Timeline unavailable"
                    : `${c.slaDays} demo SLA days`}
                </span>
                <span>
                  <ShieldCheck size={13} />
                  Evidence: demo record
                </span>
              </div>
            </div>
            <Link
              className="table-arrow"
              to={`/clearances/${c.id}`}
              aria-label="Inspect bottleneck"
            >
              <ChevronRight size={18} />
            </Link>
          </div>
        ))}
        {cs.length === 0 && (
          <EmptyState
            title="No bottlenecks in this view"
            body="There are no open exceptions matching the current demo data."
          />
        )}
      </section>
      <div className="source-note">
        <BookOpen size={16} />
        <div>
          <b>Root-cause labels are explainable hypotheses</b>
          <p>
            These signals help prioritize a conversation; they do not prove a
            department is responsible for a delay. Check query records and
            official timelines before escalation.
          </p>
        </div>
        <Link to="/admin/rules">
          Review source notes <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}
