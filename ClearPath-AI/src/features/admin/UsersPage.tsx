import { useUsers } from "@/api/hooks";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { PageProps } from "@/app/pageProps";
import { PageHeader } from "@/components/ui/PageHeader";
import { roleLabel } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Role } from "@/types";

export function UsersPage({ onToast }: PageProps) {
  const { data: userList = [], isPending, isError, refetch } = useUsers();
  if (isPending) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  return (
    <>
      <PageHeader
        eyebrow="ACCESS ADMINISTRATION"
        title="User management"
        subtitle="Preview of the user and role administration surface. Live identity controls are not connected."
      />
      <section className="panel data-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>USER</th>
                <th>ORGANIZATION</th>
                <th>ROLE</th>
                <th>ACCOUNT STATE</th>
                <th>PERMISSIONS</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {userList.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-table-cell">
                      <span className="avatar">
                        {(u.fullName || u.full_name || "User")
                          .split(" ")
                          .map((x: string) => x[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div>
                        <b>{u.fullName}</b>
                        <small>{u.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{u.organizationName}</td>
                  <td>{roleLabel(u.role)}</td>
                  <td>
                    <StatusBadge status="approved" />
                  </td>
                  <td>
                    {u.role === "admin"
                      ? "System-wide demo"
                      : u.role === "officer"
                        ? "Review queue & status actions"
                        : u.role === "consultant"
                          ? "Assigned client portfolio"
                          : "Own project workspace"}
                  </td>
                  <td>
                    <button
                      className="btn secondary small-btn"
                      onClick={() =>
                        onToast(
                          "Account status changes require the live identity service.",
                        )
                      }
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel-foot">
          Demo identities only · no real accounts or access credentials exist.
        </div>
      </section>
    </>
  );
}
