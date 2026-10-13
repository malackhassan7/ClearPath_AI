import type { PageProps } from "@/app/pageProps";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Factory,
  MapPin,
} from "lucide-react";
import { Readiness } from "@/components/domain/Readiness";
import { Link } from "react-router-dom";
import type { Project } from "@/types";

export function ClientsPage({ projects, clientId }: PageProps & { clientId?: string }) {
  const orgs = [...new Set(projects.map((p: Project) => p.organizationName).filter(Boolean))] as string[];
  const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (clientId) {
    const org = orgs.find((name) => name === clientId || slug(name) === clientId);
    if (!org) return <section className="panel empty-panel"><h3>Client not found</h3><p>No client portfolio matches “{clientId}” in the current workspace data.</p><Link className="btn secondary" to="/clients">Back to clients</Link></section>;
    const clientProjects = projects.filter((project: Project) => project.organizationName === org);
    return <>
      <PageHeader eyebrow="CONSULTANT PORTFOLIO" title={org} subtitle="Client portfolio and associated project readiness." actions={<Link className="btn secondary" to="/clients">Back to directory</Link>} />
      <div className="metric-grid compact-metrics"><StatCard label="Projects" value={clientProjects.length} icon={Factory}/><StatCard label="Average readiness" value={`${Math.round(clientProjects.reduce((sum, project) => sum + (project.readinessScore ?? 50), 0) / Math.max(clientProjects.length, 1))}%`} icon={Activity}/></div>
      <section className="panel data-panel"><div className="table-scroll"><table><thead><tr><th>PROJECT</th><th>DISTRICT</th><th>STAGE</th><th>READINESS</th><th/></tr></thead><tbody>{clientProjects.map((project) => <tr key={project.id}><td><b>{project.name}</b><small>{project.code}</small></td><td>{project.district}</td><td>{project.stage || "Planning"}</td><td>{project.readinessScore ?? 50}%</td><td><Link className="table-link" to={`/projects/${project.id}`}>Open project</Link></td></tr>)}</tbody></table></div></section>
    </>;
  }
  return (
    <>
      <PageHeader
        eyebrow="CONSULTANT PORTFOLIO"
        title="Client directory"
        subtitle="A consolidated view of fictional client organizations and their project readiness."
      />
      <div className="metric-grid compact-metrics">
        <StatCard label="Organizations" value={orgs.length} icon={Building2} />
        <StatCard
          label="Projects in portfolio"
          value={projects.length}
          icon={Factory}
          tone="blue"
        />
        <StatCard
          label="Need intervention"
          value={projects.filter((p: Project) => (p.readinessScore ?? 50) < 80).length}
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Average readiness"
          value={`${projects.length ? Math.round(projects.reduce((s: number, p: Project) => s + (p.readinessScore ?? 50), 0) / projects.length) : 0}%`}
          icon={Activity}
          tone="rose"
        />
      </div>
      <div className="client-grid">
        {orgs.map((org) => {
          const ps = projects.filter(
            (p: Project) => p.organizationName === org,
          );
          const avg = Math.round(
            ps.reduce((s: number, p: Project) => s + (p.readinessScore ?? 50), 0) /
              Math.max(ps.length, 1),
          );
          return (
            <div className="panel client-card" key={org}>
              <div className="client-card-top">
                <div className="client-logo">
                  <Building2 size={21} />
                </div>
                <span className="stage-tag">Demo client</span>
              </div>
              <h3>{org}</h3>
              <p>
                <MapPin size={14} />
                {[...new Set(ps.map((p: Project) => p.district))].join(", ")}
              </p>
              <div className="client-stats">
                <div>
                  <small>Projects</small>
                  <b>{ps.length}</b>
                </div>
                <div>
                  <small>Readiness</small>
                  <b>{avg}%</b>
                </div>
              </div>
              <Readiness value={avg} />
              <div className="client-card-bottom">
                <span>
                  {avg < 70
                    ? "Needs attention"
                    : avg < 85
                      ? "In progress"
                      : "Strong readiness"}
                </span>
                <Link to={`/clients/${slug(org)}`}>
                  View portfolio <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
