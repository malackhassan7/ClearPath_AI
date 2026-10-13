import type { PageProps } from "@/app/pageProps";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Clearance } from "@/types";

export function ReviewQueue({
  clearances,
  role,
  onUpdateClearance,
}: PageProps) {
  const [filter, setFilter] = useState("Open items");
  const list = clearances.filter(
    (c: Clearance) =>
      filter === "All items" ||
      !["approved", "not_applicable"].includes(c.status),
  );
  return (
    <>
      <PageHeader
        eyebrow="AUTHORIZED REVIEW WORKSPACE"
        title="Review queue"
        subtitle="Illustrative review tasks for authorized officer and administrator demo roles."
      />
      <div className="screening-note">
        <ShieldCheck size={18} />
        <div>
          <b>Role boundary reminder</b>
          <p>
            Only an authorized live backend can validate officer identity,
            enforce permissions, and persist official decisions. Actions here
            change demo state only.
          </p>
        </div>
      </div>
      <div className="doc-tabs">
        <button
          className={filter === "Open items" ? "active" : ""}
          onClick={() => setFilter("Open items")}
        >
          Open items{" "}
          <span>
            {
              clearances.filter(
                (c: Clearance) =>
                  !["approved", "not_applicable"].includes(c.status),
              ).length
            }
          </span>
        </button>
        <button
          className={filter === "All items" ? "active" : ""}
          onClick={() => setFilter("All items")}
        >
          All items <span>{clearances.length}</span>
        </button>
      </div>
      <section className="panel data-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>REVIEW ITEM</th>
                <th>PROJECT</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
                <th>PENDING</th>
                <th>DEMO ACTION</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c: Clearance) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                    <small>{c.shortCode}</small>
                  </td>
                  <td>{c.projectName}</td>
                  <td>{c.department}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>{c.pendingDays} d</td>
                  <td>
                    <div className="inline-actions">
                      <button
                        className="mini-action"
                        onClick={() => onUpdateClearance(c.id, "under_review")}
                      >
                        Under review
                      </button>
                      <button
                        className="mini-action approve"
                        onClick={() => onUpdateClearance(c.id, "approved")}
                      >
                        Approve demo
                      </button>
                      <button
                        className="mini-action reject"
                        onClick={() => onUpdateClearance(c.id, "rejected")}
                      >
                        Reject demo
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
