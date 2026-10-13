import type { PageProps } from "@/app/pageProps";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ChartNoAxesCombined,
  Check,
  GitBranch,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Clearance, Project } from "@/types";

export function WorkflowPage({ clearances, projects, projectId }: PageProps) {
  const p = projects.find((x: Project) => x.id === projectId) || projects[0];
  const cs = clearances.filter(
    (c: Clearance) => !projectId || c.projectId === projectId,
  );
  return (
    <>
      <PageHeader
        eyebrow="WORKFLOW EXPLAINER"
        title="Workflow & dependencies"
        subtitle="Understand what can progress in parallel, what is waiting, and why a stage is blocked."
        actions={
          <Link
            to={projectId ? `/projects/${p.id}/bottlenecks` : "/bottlenecks"}
            className="btn secondary"
          >
            <ChartNoAxesCombined size={16} /> View bottlenecks
          </Link>
        }
      />
      <div className="workflow-banner">
        <div className="workflow-banner-icon">
          <GitBranch size={22} />
        </div>
        <div>
          <b>{p.name}</b>
          <p>
            Illustrative dependency view · Confirm all prerequisites with the
            responsible department.
          </p>
        </div>
        <StatusBadge status="needs_authority_review" />
      </div>
      <section className="panel workflow-panel">
        <SectionTitle
          title="Stage timeline"
          sub="The path from project setup to authority outcome"
        />
        <div className="workflow-timeline">
          {[
            {
              n: "01",
              title: "Project profile",
              desc: "Business, location and facility particulars",
              state: "done",
            },
            {
              n: "02",
              title: "Applicability screening",
              desc: "Potential department requirements identified",
              state: "done",
            },
            {
              n: "03",
              title: "Document preparation",
              desc: "Mandatory evidence collected and checked",
              state: "active",
            },
            {
              n: "04",
              title: "Application & queries",
              desc: "Submit and respond to official requests",
              state: "waiting",
            },
            {
              n: "05",
              title: "Authority review",
              desc: "Department evaluation and decision",
              state: "waiting",
            },
            {
              n: "06",
              title: "Pre-operation readiness",
              desc: "Verify applicable remaining approvals",
              state: "waiting",
            },
          ].map((s, i) => (
            <div className={`wf-step ${s.state}`} key={s.n}>
              <div className="wf-marker">
                {s.state === "done" ? <Check size={15} /> : s.n}
              </div>
              <div className="wf-content">
                <div>
                  <span>STAGE {s.n}</span>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
                <StatusBadge
                  status={
                    s.state === "done"
                      ? "approved"
                      : s.state === "active"
                        ? "under_review"
                        : "not_started"
                  }
                />
              </div>
              {i < 5 && <div className="wf-connector" />}
            </div>
          ))}
        </div>
      </section>
      <section className="panel dependency-panel">
        <SectionTitle
          title="Clearance dependency graph"
          sub="Select any item below to inspect its prerequisites and explanation."
        />
        <div className="graph-canvas">
          <svg
            viewBox="0 0 900 260"
            role="img"
            aria-label="Illustrative clearance dependency diagram"
          >
            <defs>
              <marker
                id="arrow"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L6,3 z" fill="#9aa99e" />
              </marker>
            </defs>
            <path
              d="M220 65 L350 65"
              stroke="#9aa99e"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <path
              d="M220 65 C290 65 280 190 350 190"
              stroke="#9aa99e"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrow)"
            />
            <path
              d="M520 65 L650 125"
              stroke="#9aa99e"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <path
              d="M520 190 L650 135"
              stroke="#9aa99e"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <g>
              <rect
                x="35"
                y="30"
                width="185"
                height="70"
                rx="10"
                fill="#eef4ef"
                stroke="#a7c3af"
              />
              <text
                x="127"
                y="58"
                textAnchor="middle"
                fontSize="12"
                fill="#234f3c"
                fontWeight="600"
              >
                Project profile
              </text>
              <text
                x="127"
                y="77"
                textAnchor="middle"
                fontSize="10"
                fill="#557363"
              >
                Site & facility data
              </text>
            </g>
            <g>
              <rect
                x="350"
                y="30"
                width="170"
                height="70"
                rx="10"
                fill="#fff5e5"
                stroke="#e7c88f"
              />
              <text
                x="435"
                y="58"
                textAnchor="middle"
                fontSize="12"
                fill="#8a5711"
                fontWeight="600"
              >
                Planning review
              </text>
              <text
                x="435"
                y="77"
                textAnchor="middle"
                fontSize="10"
                fill="#997443"
              >
                May gate factory plan
              </text>
            </g>
            <g>
              <rect
                x="350"
                y="155"
                width="170"
                height="70"
                rx="10"
                fill="#eef2f8"
                stroke="#c4d1e3"
              />
              <text
                x="435"
                y="183"
                textAnchor="middle"
                fontSize="12"
                fill="#415b7c"
                fontWeight="600"
              >
                Document checks
              </text>
              <text
                x="435"
                y="202"
                textAnchor="middle"
                fontSize="10"
                fill="#697f9a"
              >
                Readiness evidence
              </text>
            </g>
            <g>
              <rect
                x="650"
                y="90"
                width="205"
                height="75"
                rx="10"
                fill="#f9eaea"
                stroke="#e0b1b1"
              />
              <text
                x="752"
                y="120"
                textAnchor="middle"
                fontSize="12"
                fill="#8d3438"
                fontWeight="600"
              >
                Factory plan / licence
              </text>
              <text
                x="752"
                y="139"
                textAnchor="middle"
                fontSize="10"
                fill="#a05d60"
              >
                Blocked until verified
              </text>
            </g>
          </svg>
          <div className="graph-legend">
            <span>
              <i className="legend-dot green-dot" /> Completed in demo
            </span>
            <span>
              <i className="legend-dot amber-dot" /> In progress / query
            </span>
            <span>
              <i className="legend-dot rose-dot" /> Dependency risk
            </span>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>WORKFLOW ITEM</th>
                <th>STATUS</th>
                <th>DEPENDENCIES</th>
                <th>WHY IT MATTERS</th>
              </tr>
            </thead>
            <tbody>
              {cs.map((c: Clearance) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                    <small>{c.shortCode}</small>
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>
                    {c.dependencies.length
                      ? c.dependencies
                          .map(
                            (id: string) =>
                              cs.find((x: Clearance) => x.id === id)?.name ||
                              id,
                          )
                          .join(", ")
                      : "No dependency listed"}
                  </td>
                  <td className="next-action-cell">{c.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="source-note">
        <AlertCircle size={16} />
        <div>
          <b>Dependency confidence: illustrative</b>
          <p>
            Connections are sample workflow relationships, not verified legal
            prerequisites. Confirm applicability and sequence with each
            department.
          </p>
        </div>
      </div>
    </>
  );
}
