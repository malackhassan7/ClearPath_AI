import { ArrowLeft, FileCheck2, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import type { Clearance } from "@/types";
import type { PageProps } from "@/app/pageProps";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function ClearanceDetailPage({ clearances, clearanceId }: PageProps & { clearanceId: string }) {
  const item = clearances.find((clearance: Clearance) => clearance.id === clearanceId);
  if (!item) return <section className="panel empty-panel"><h3>Clearance record not found</h3><p>No clearance with ID “{clearanceId}” exists in the current dataset.</p><Link className="btn secondary" to="/clearances"><ArrowLeft size={15}/> Back to clearances</Link></section>;
  return <>
    <PageHeader eyebrow="CLEARANCE RECORD" title={item.name} subtitle={`${item.department} · ${item.projectName}`} actions={<Link className="btn secondary" to="/clearances"><ArrowLeft size={15}/> All clearances</Link>} />
    <div className="detail-grid"><section className="panel detail-panel"><h3><FileCheck2 size={18}/> Current status</h3><StatusBadge status={item.status}/><dl><dt>Department</dt><dd>{item.department}</dd><dt>Project</dt><dd><Link to={`/projects/${item.projectId}`}>{item.projectName}</Link></dd><dt>Stage</dt><dd>{item.stage}</dd><dt>Pending days</dt><dd>{item.pendingDays}</dd><dt>Prescribed time limit</dt><dd>{item.slaDays == null ? "Timeline unavailable" : `${item.slaDays} days`}</dd><dt>Document readiness</dt><dd>{item.documentReadinessPercent}%</dd></dl></section><section className="panel detail-panel"><h3><ShieldAlert size={18}/> Explanation and next action</h3><p>{item.ruleCitation || "No verified rule citation is attached to this record."}</p><p>{item.nextAction || "Confirm the next required action with the responsible authority."}</p><small>ClearPath-TN is a decision-support prototype and does not issue or change government clearance decisions.</small></section></div>
  </>;
}

export function NotFoundPage({ path }: { path: string }) {
  return <section className="panel empty-panel"><h2>Page not found</h2><p>The route <code>{path}</code> is not part of the ClearPath-TN workspace.</p><Link className="btn primary" to="/dashboard">Return to dashboard</Link></section>;
}
