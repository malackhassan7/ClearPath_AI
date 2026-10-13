import type { PageProps } from "@/app/pageProps";
import { useState } from "react";
import { users } from "@/data/demo";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { roleLabel } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function SettingsPage({
  section = "profile",
  role,
  onContrast,
  highContrast,
  onLogout,
  onToast,
}: PageProps) {
  const [name, setName] = useState(users[role].name);
  const [email, setEmail] = useState(users[role].email);
  const [digest, setDigest] = useState(true);
  const [security, setSecurity] = useState(true);
  const titles: Record<string, string> = {
    profile: "Profile settings",
    security: "Security settings",
    organization: "Organization settings",
    notifications: "Notification preferences",
  };
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE SETTINGS"
        title={titles[section] || "Settings"}
        subtitle="Manage your local demo preferences and inspect settings planned for the production workspace."
      />
      <div className="settings-layout">
        <aside className="panel settings-nav">
          {(
            [
              ["profile", "Profile", CircleUserRound],
              ["security", "Security", LockKeyhole],
              ["organization", "Organization", Building2],
              ["notifications", "Notifications", SlidersHorizontal],
            ] as [string, string, LucideIcon][]
          ).map(([id, label, I]) => (
            <Link
              className={section === id ? "active" : ""}
              to={`/settings/${id}`}
              key={id}
            >
              <I size={17} />
              {label}
              <ChevronRight size={15} />
            </Link>
          ))}
        </aside>
        <section className="panel settings-content">
          {section === "profile" && (
            <>
              <SectionTitle
                title="Personal profile"
                sub="Your demo identity details"
              />
              <div className="profile-large">
                <div className="avatar profile-avatar">
                  {users[role].initials}
                </div>
                <div>
                  <b>{name}</b>
                  <p>{roleLabel(role)}</p>
                  <span className="stage-tag">Demo account</span>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full name</label>
                  <input
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email address</label>
                  <input
                    className="form-control"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group span-2">
                  <label>Role</label>
                  <input
                    className="form-control"
                    value={roleLabel(role)}
                    disabled
                  />
                </div>
              </div>
              <button
                className="btn primary"
                onClick={() =>
                  onToast(
                    "Profile edits are local preview only; identity service is not connected.",
                  )
                }
              >
                Save profile
              </button>
            </>
          )}
          {section === "security" && (
            <>
              <SectionTitle
                title="Security & session"
                sub="Controls available in this prototype"
              />
              <div className="settings-option">
                <div className="option-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <b>High-contrast mode</b>
                  <p>
                    Increase separation between text, borders, and status
                    surfaces.
                  </p>
                </div>
                <button
                  className={`toggle ${highContrast ? "on" : ""}`}
                  onClick={onContrast}
                  role="switch"
                  aria-checked={highContrast}
                >
                  <span />
                </button>
              </div>
              <div className="settings-option">
                <div className="option-icon">
                  <LockKeyhole size={18} />
                </div>
                <div>
                  <b>Multi-factor authentication</b>
                  <p>
                    Production readiness placeholder; no MFA enrollment occurs
                    here.
                  </p>
                </div>
                <StatusBadge status="needs_authority_review" />
              </div>
              <div className="settings-option">
                <div className="option-icon">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <b>Demo session</b>
                  <p>Clear the current simulated signed-in session.</p>
                </div>
                <button className="btn secondary" onClick={onLogout}>
                  Sign out <LogOut size={15} />
                </button>
              </div>
            </>
          )}
          {section === "organization" && (
            <>
              <SectionTitle
                title="Organization profile"
                sub="Fictional organization context"
              />
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>Organization</label>
                  <input
                    className="form-control"
                    value={users[role].org}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Workspace type</label>
                  <input
                    className="form-control"
                    value={
                      role === "consultant"
                        ? "Consultancy"
                        : role === "officer"
                          ? "Department"
                          : "MSME / Enterprise demo"
                    }
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>District</label>
                  <input
                    className="form-control"
                    value="Tamil Nadu (demo)"
                    disabled
                  />
                </div>
              </div>
              <div className="screening-note">
                <Building2 size={18} />
                <div>
                  <b>Organization assignment</b>
                  <p>
                    Live organization assignments and authorized representatives
                    require backend verification and administrator approval.
                  </p>
                </div>
              </div>
            </>
          )}
          {section === "notifications" && (
            <>
              <SectionTitle
                title="Notification preferences"
                sub="Choose how this local prototype presents activity."
              />
              <div className="settings-option">
                <div className="option-icon">
                  <Bell size={18} />
                </div>
                <div>
                  <b>In-app notifications</b>
                  <p>Show status changes, document queries and delay alerts.</p>
                </div>
                <button
                  className={`toggle ${security ? "on" : ""}`}
                  role="switch"
                  aria-checked={security}
                  onClick={() => setSecurity(!security)}
                >
                  <span />
                </button>
              </div>
              <div className="settings-option">
                <div className="option-icon">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <b>Weekly readiness digest</b>
                  <p>A future backend may summarize open items each week.</p>
                </div>
                <button
                  className={`toggle ${digest ? "on" : ""}`}
                  role="switch"
                  aria-checked={digest}
                  onClick={() => setDigest(!digest)}
                >
                  <span />
                </button>
              </div>
              <button
                className="btn primary"
                onClick={() =>
                  onToast(
                    "Notification preferences saved for this current view only.",
                  )
                }
              >
                Save preferences
              </button>
            </>
          )}
        </section>
      </div>
    </>
  );
}
