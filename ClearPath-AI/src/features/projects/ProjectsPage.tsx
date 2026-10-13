import type { PageProps } from "@/app/pageProps";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Download,
  Factory,
  Filter,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { money } from "@/lib/format";
import { Readiness } from "@/components/domain/Readiness";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Project } from "@/types";

export function ProjectsPage({ projects, role, onToast }: PageProps) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All stages");
  const [industry, setIndustry] = useState("All categories");
  const list = projects.filter(
    (p: Project) =>
      `${p.name} ${p.code} ${p.district} ${p.organizationName}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (stage === "All stages" || p.stage === stage) &&
      (industry === "All categories" || p.industryCategory === industry),
  );
  return (
    <>
      <PageHeader
        eyebrow="PROJECT REGISTRY"
        title="Industrial projects"
        subtitle="A single view of project particulars, clearance readiness, and required next actions."
        actions={
          <Link to="/projects/new" className="btn primary">
            <Plus size={17} /> Create project
          </Link>
        }
      />
      <div className="metric-grid compact-metrics">
        <StatCard label="All projects" value={projects.length} icon={Factory} />
        <StatCard
          label="Action required"
          value={projects.filter((p: Project) => (p.readinessScore ?? 50) < 80).length}
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Mean readiness"
          value={`${projects.length ? Math.round(projects.reduce((s: number, p: Project) => s + (p.readinessScore ?? 50), 0) / projects.length) : 0}%`}
          icon={Activity}
          tone="blue"
        />
        <StatCard
          label="Districts covered"
          value={new Set(projects.map((p: Project) => p.district)).size}
          icon={MapPin}
          tone="rose"
        />
      </div>
      <section className="panel data-panel">
        <div className="filter-row">
          <div className="search-field">
            <Search size={17} />
            <input
              placeholder="Search projects, codes, districts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option>All stages</option>
            {[
              "Planning",
              "Pre-Construction",
              "Pre-Operation",
              "Operational",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option>All categories</option>
            {["Green", "White", "Orange", "Red"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button
            className="btn secondary"
            onClick={() => {
              setQuery("");
              setStage("All stages");
              setIndustry("All categories");
            }}
          >
            <Filter size={15} /> Reset
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PROJECT / PROJECT ID</th>
                <th>ORGANIZATION</th>
                <th>DISTRICT</th>
                <th>INDUSTRY</th>
                <th>INVESTMENT</th>
                <th>READINESS</th>
                <th>STAGE</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p: Project) => (
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
                  <td>{p.organizationName}</td>
                  <td>{p.district}</td>
                  <td>
                    <span
                      className={`industry-tag ${(p.industryCategory || "White").toLowerCase()}`}
                    >
                      {p.industryCategory || "Dairy"}
                    </span>
                  </td>
                  <td>{money(p.investmentInrLakhs ?? 0)}</td>
                  <td>
                    <Readiness value={p.readinessScore ?? 50} />
                  </td>
                  <td>
                    <span className="stage-tag">{p.stage || "Planning"}</span>
                  </td>
                  <td>
                    <Link className="table-arrow" to={`/projects/${p.id}`}>
                      <ChevronRight size={17} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <EmptyState
            title="No matching projects"
            body="Try changing your search or filters."
            action={
              <button
                className="btn secondary"
                onClick={() => {
                  setQuery("");
                  setStage("All stages");
                  setIndustry("All categories");
                }}
              >
                Clear filters
              </button>
            }
          />
        )}
        <div className="panel-foot">
          <span>
            {list.length} project{list.length === 1 ? "" : "s"} · All records
            marked demo
          </span>
          <button className="text-link" onClick={() => window.print()}>
            Export / print <Download size={14} />
          </button>
        </div>
      </section>
      <div className="privacy-banner">
        <ShieldCheck size={17} />
        <div>
          <b>Privacy reminder</b>
          <p>
            Use only fictional demonstration files. Do not upload real Aadhaar,
            PAN, bank passbooks, or personal identifiers.
          </p>
        </div>
      </div>
    </>
  );
}
