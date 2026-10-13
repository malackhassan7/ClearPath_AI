import type { PageProps } from "@/app/pageProps";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Bell, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function NotificationsPage({
  notifications,
  onMarkNotifications,
}: PageProps) {
  const [filter, setFilter] = useState("All");
  const list = notifications.filter(
    (n) => filter === "All" || (filter === "Unread" && !n.read),
  );
  return (
    <>
      <PageHeader
        eyebrow="ACTIVITY CENTRE"
        title="Notifications"
        subtitle="A chronological feed of simulated queries, status changes, and readiness reminders."
        actions={
          <button
            className="btn secondary"
            onClick={() => onMarkNotifications("all", true)}
          >
            <CheckCheckIcon /> Mark all read
          </button>
        }
      />
      <div className="doc-tabs">
        {["All", "Unread"].map((t) => (
          <button
            className={filter === t ? "active" : ""}
            key={t}
            onClick={() => setFilter(t)}
          >
            {t}
            <span>
              {t === "All"
                ? notifications.length
                : notifications.filter((n) => !n.read).length}
            </span>
          </button>
        ))}
      </div>
      <section className="panel notification-list">
        {list.map((n) => (
          <div
            className={`notification-row ${n.read ? "read" : ""}`}
            key={n.id}
          >
            <div className="notification-symbol">
              <Bell size={17} />
            </div>
            <div className="notification-copy">
              <b>{n.title}</b>
              <p>{n.message}</p>
              <small>
                {new Date(n.createdAt).toLocaleString()} · Demo event
              </small>
            </div>
            {!n.read && <span className="unread-dot" />}
            <button
              className="btn quiet"
              onClick={() => onMarkNotifications([n.id], !n.read)}
            >
              {n.read ? "Mark unread" : "Mark read"}
            </button>
          </div>
        ))}
        {list.length === 0 && (
          <EmptyState
            title="You're all caught up"
            body="No unread notifications in this demo feed."
          />
        )}
      </section>
    </>
  );
}

export function CheckCheckIcon() {
  return <CheckCircle2 size={16} />;
}
