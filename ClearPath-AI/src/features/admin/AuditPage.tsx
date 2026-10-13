import { useAuditEvents } from "@/api/hooks";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { PageProps } from "@/app/pageProps";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function AuditPage(_props: Partial<PageProps>) {
  const { data: events = [], isPending, isError, refetch } = useAuditEvents();
  if (isPending) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  return (
    <>
      <PageHeader
        eyebrow="AUDIT & ACCOUNTABILITY"
        title="Audit trail"
        subtitle="Chronological activity context for the demo workspace. This browser-side list is not tamper-evident."
      />
      <div className="screening-note">
        <ShieldCheck size={18} />
        <div>
          <b>Audit ledger limitation</b>
          <p>
            A production append-only ledger must be stored server-side,
            access-controlled, integrity-protected, and retained under an
            approved policy. This display is illustrative only.
          </p>
        </div>
      </div>
      <section className="panel data-panel">
        <SectionTitle
          title="Recent activity"
          sub="Only actions recorded by a connected backend can appear here"
        />
        {events.length === 0 ? (
          <EmptyState
            title="No audit events recorded"
            body="No backend audit ledger is connected. Public source visits are not tracked, and no events have been fabricated."
          />
        ) : (
          <div className="audit-list">
            {events.map((e: any) => (
              <div className="audit-event" key={e.id}>
                <div className="audit-timeline-dot" />
                <div className="audit-time">{e.time}</div>
                <div className="audit-content">
                  <b>{e.action}</b>
                  <p>{e.resource}</p>
                  <small>{e.note}</small>
                </div>
                <div className="audit-actor">
                  <span className="avatar">
                    {e.actor
                      .split(" ")
                      .map((x: string) => x[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div>
                    <b>{e.actor}</b>
                    <small>{e.role}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
