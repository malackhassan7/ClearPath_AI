import { Activity, ArrowLeft, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import type { PageProps } from "@/app/pageProps";
import { PageHeader } from "@/components/ui/PageHeader";

export function ProjectActivityPage({ projects, clearances, documents, projectId }: PageProps & { projectId: string }) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return <section className="panel empty-panel"><h3>Project not found</h3><p>The project ID does not match a project in the current data source.</p><Link className="btn secondary" to="/projects">Back to projects</Link></section>;
  const projectClearances = clearances.filter((item) => item.projectId === projectId);
  const projectDocuments = documents.filter((item) => item.projectId === projectId);
  const events = [
    ...projectClearances.map((item) => ({ id: `c-${item.id}`, title: `Clearance: ${item.name}`, detail: `Current status: ${item.status.replaceAll("_", " ")}`, date: item.lastUpdatedDate || project.updatedAt || "", icon: "clearance" })),
    ...projectDocuments.map((item) => ({ id: `d-${item.id}`, title: `Document: ${item.document_name || item.name || ""}`, detail: `Current status: ${item.status.replaceAll("_", " ")}`, date: String(item.uploadedAt || project.updatedAt || ""), icon: "document" })),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return <>
    <PageHeader eyebrow={`PROJECT · ${project.code}`} title="Project activity" subtitle="A consolidated view of the current clearance and document records associated with this project." actions={<Link className="btn secondary" to={`/projects/${projectId}`}><ArrowLeft size={15}/> Project overview</Link>} />
    <section className="panel data-panel">
      <div className="section-title-row"><div><h3><Activity size={18}/> Activity records</h3><p>These are current record snapshots, not a verified immutable audit history.</p></div><span className="stage-tag">{events.length} records</span></div>
      {events.length === 0 ? <p>No clearance or document activity records are available for this project.</p> : <div className="activity-list">{events.map((event) => <article className="activity-item" key={event.id}><span className="activity-icon"><Clock3 size={16}/></span><div><b>{event.title}</b><p>{event.detail}</p><small>{event.date}</small></div></article>)}</div>}
    </section>
  </>;
}
