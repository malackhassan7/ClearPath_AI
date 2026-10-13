import { useEffect, useState } from "react";
import { navGroups, users } from "@/data/demo";
import { useSession } from "@/app/session";
import { useNotifications } from "@/api/hooks";
import { useLanguage } from "@/app/LanguageContext";
import { env } from "@/lib/env";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthPage } from "@/features/auth/AuthPage";
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Globe,
  Menu,
  MessageSquare,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { iconMap } from "@/components/layout/navIcons";
import { pageName, roleLabel } from "@/lib/format";
import { PageRouter } from "@/app/PageRouter";
import type { Role } from "@/types";
import {
  allowedRolesForPath,
  ProtectedRoute,
  PUBLIC_PATHS,
  RoleGuard,
} from "@/app/AccessGuards";

export function App() {
  const {
    role,
    signedIn,
    sessionExpired,
    highContrast,
    toast,
    setToast,
    setRole,
    signIn,
    signOut,
    toggleContrast,
  } = useSession();
  const { data: notifications = [] } = useNotifications();
  const { lang, toggleLang, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = users[role] || users.entrepreneur;
  const authPaths = PUBLIC_PATHS;

  useEffect(() => {
    if (sessionExpired && location.pathname !== "/session-expired") {
      navigate("/session-expired", {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [sessionExpired, location.pathname, navigate]);

  const changeRole = (v: Role) => {
    setRole(v);
    setToast(`Switched view to ${users[v]?.name || v}`);
  };

  const toggleLanguage = () => {
    toggleLang();
    setToast(
      lang === "en"
        ? "மொழி தமிழுக்கு மாற்றப்பட்டது"
        : "Language switched to English",
    );
  };

  const logout = () => {
    signOut();
    navigate("/login");
  };

  if (!signedIn) {
    if (
      sessionExpired ||
      location.pathname === "/session-expired" ||
      location.pathname === "/unauthorized"
    ) {
      return (
        <AuthPage
          path={sessionExpired ? "/session-expired" : location.pathname}
          onLogin={(r) => {
            signIn(r);
            navigate("/dashboard", { replace: true });
          }}
          navigate={navigate}
          toast={setToast}
        />
      );
    }
    if (authPaths.includes(location.pathname)) {
      return (
        <AuthPage
          path={location.pathname}
          onLogin={(r) => {
            signIn(r);
            navigate("/dashboard", { replace: true });
          }}
          navigate={navigate}
          toast={setToast}
        />
      );
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (authPaths.includes(location.pathname)) {
    return (
      <AuthPage
        path={location.pathname}
        onLogin={(r) => {
          signIn(r);
          navigate("/dashboard", { replace: true });
        }}
        navigate={navigate}
        toast={setToast}
      />
    );
  }

  return (
    <div
      className={`app ${sidebarOpen ? "nav-open" : ""} ${lang === "ta" ? "lang-ta" : ""}`}
    >
      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark dairy-mark" title="ClearPathAI">
            {/* Elegant SVG Milk drop & leaf emblem */}
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
                fill="#1b6c5c"
                stroke="#14573f"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M12 12c-1.5 1.5-2 3-1 4.5"
                stroke="#faf8f3"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <b>
              ClearPath<span className="brand-accent">AI</span>
            </b>
            <small>TAMIL NADU DAIRY PLATFORM</small>
          </div>
          <button
            className="icon-btn sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-switch">
          <div className="org-avatar">
            <Building2 size={17} />
          </div>
          <div className="org-copy">
            <b>
              {role === "farmer"
                ? "Farmer Workspace"
                : role === "entrepreneur" || role === "applicant"
                  ? "Dairy Venture Workspace"
                  : role === "consultant"
                    ? "Consultant Desk"
                    : role === "officer"
                      ? "Regulatory Review Desk"
                      : "System Administration"}
            </b>
            <small>{user.org}</small>
          </div>
          <ChevronDown size={15} />
        </div>

        <nav>
          {navGroups.map((group) => {
            const groupTitle =
              group.label === "WORKSPACE"
                ? t("nav_workspace", "WORKSPACE")
                : group.label === "REGULATORY DESK"
                  ? t("nav_regulatory_desk", "REGULATORY DESK")
                  : t("nav_preferences", "PREFERENCES");
            return (
              <div className="nav-group" key={group.label}>
                <div className="nav-label">{groupTitle}</div>
                {(group.items as unknown as [string, string, string][])
                  .filter(
                    ([path]) => path !== "/clients" || role === "consultant",
                  )
                  .filter(
                    ([path]) =>
                      !path.startsWith("/admin") ||
                      ["officer", "admin"].includes(role),
                  )
                  .filter(
                    ([path]) =>
                      path !== "admin-audit" ||
                      ["officer", "admin"].includes(role),
                  )
                  .filter(([path]) => path !== "/admin/users" || role === "admin")
                  .map(([path, label, icon]) => {
                    const Icon = iconMap[icon] || Activity;
                    const to =
                      path === "admin-audit" ? "/admin/audit-logs" : path;
                    const active =
                      location.pathname === to ||
                      (to !== "/dashboard" &&
                        location.pathname.startsWith(to + "/"));
                    const itemKey =
                      label === "Overview"
                        ? "nav_overview"
                        : label === "Dairy projects"
                          ? "nav_projects"
                          : label === "FSSAI tracker"
                            ? "nav_clearances"
                            : label === "Document vault"
                              ? "nav_documents"
                              : label === "Brand comparison"
                                ? "nav_brands"
                                : label === "District finder"
                                  ? "nav_districts"
                                  : label === "Govt schemes"
                                    ? "nav_schemes"
                                    : label === "AI compliance bot"
                                      ? "nav_chatbot"
                                      : label === "Grievances"
                                        ? "nav_grievances"
                                        : label === "Notifications"
                                          ? "nav_notifications"
                                          : label === "Review queue"
                                            ? "nav_review_queue"
                                            : label === "Rules & sources"
                                              ? "nav_rules"
                                              : label === "User management"
                                                ? "nav_users"
                                                : label === "Audit trail"
                                                  ? "nav_audit"
                                                  : label === "My profile"
                                                    ? "nav_profile"
                                                    : label === "Help & guidance"
                                                      ? "nav_help"
                                                      : "";
                    const translatedLabel = itemKey ? t(itemKey, label) : label;
                    return (
                      <Link
                        key={path}
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={`nav-link ${active ? "active" : ""}`}
                      >
                        <Icon size={18} />
                        <span>{translatedLabel}</span>
                        {label === "Notifications" &&
                          notifications.some(
                            (n: { read?: boolean; is_read?: boolean }) =>
                              !n.read && !n.is_read,
                          ) && <i className="nav-dot" />}
                        {active && (
                          <ChevronRight className="nav-chevron" size={15} />
                        )}
                      </Link>
                    );
                  })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card dairy-help-card">
            <div className="help-icon">
              <ShieldCheck size={18} />
            </div>
            <b>Grounded in Official Data</b>
            <p>
              Rules, fees, and milk datasets cited from FoSCoS & data.gov.in.
            </p>
            <Link to="/help">
              Explore data sources <ArrowRight size={13} />
            </Link>
          </div>

          <button
            className="user-mini"
            onClick={() => navigate("/settings/profile")}
          >
            <div className="avatar">{user.initials}</div>
            <div className="user-copy">
              <b>{user.name}</b>
              <small>{roleLabel(role)}</small>
            </div>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      <div className="mobile-scrim" onClick={() => setSidebarOpen(false)} />

      {/* ── Main Content Area ──────────────────────────────── */}
      <main className="main">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>

          <div className="crumb">
            <span>ClearPathAI</span>
            <ChevronRight size={14} />
            <b>{pageName(location.pathname)}</b>
          </div>

          <div className="top-actions">
            {/* Language switch button */}
            <button
              className="lang-toggle-btn"
              onClick={toggleLanguage}
              title="Toggle English / Tamil"
            >
              <Globe size={15} />
              <span>{lang === "en" ? "தமிழ்" : "English"}</span>
            </button>

            {/* Official Data Source Badge */}
            <div className="demo-pill source-mode-pill">
              <span /> {t("official_data_badge", "Official Sourced Data")}{" "}
              <em>· {t("official_data_sub", "data.gov.in & FoSCoS")}</em>
            </div>

            <button
              className="icon-btn notification-btn"
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
            >
              <Bell size={18} />
              {notifications.some(
                (n: { read?: boolean; is_read?: boolean }) =>
                  !n.read && !n.is_read,
              ) && <i />}
            </button>

            <div className="top-divider" />

            {/* Role Switcher */}
            <select
              aria-label="Switch stakeholder view"
              value={role}
              onChange={(e) => changeRole(e.target.value as Role)}
              className="role-select"
            >
              <option value="user">User / Dairy Stakeholder</option>
              <option value="officer">FSSAI Officer view</option>
              <option value="admin">Admin view</option>
            </select>

            <button
              className="avatar top-avatar"
              onClick={() => navigate("/settings/profile")}
              title="Open profile"
            >
              {user.initials}
            </button>
          </div>
        </header>

        {/* Official Governance & Disclaimer Notice Banner */}
        <div
          className="demo-notice dairy-notice"
          aria-label="Demo data mode"
          role="region"
        >
          <ShieldCheck size={16} />
          <span>
            <b>{t("banner_title", "Official Data Grounding:")}</b>{" "}
            {t(
              "banner_text",
              "Statutory FSSAI rules, district milk production records (2009–2019), and Aavin franchise norms loaded from official publications. Final regulatory decisions are performed by authorized FSSAI officers.",
            )}
          </span>
          <button onClick={() => navigate("/help")}>
            {t("banner_citations", "View Citations")} <ArrowRight size={13} />
          </button>
        </div>

        {/* Page Router with Protected Access */}
        <div className="page-wrap">
          <ProtectedRoute>
            <RoleGuard
              role={role}
              allowedRoles={allowedRolesForPath(location.pathname)}
            >
              <PageRouter
                path={location.pathname}
                role={role}
                onToast={setToast}
                onContrast={toggleContrast}
                highContrast={highContrast}
                onLogout={logout}
              />
            </RoleGuard>
          </ProtectedRoute>
        </div>

        {/* Footer */}
        <footer className="footer">
          <span>
            ClearPathAI <span className="footer-dot">•</span> Unified Digital
            Platform for the Tamil Nadu Dairy Ecosystem
          </span>
          <span>
            Source Data: FSSAI FoSCoS, data.gov.in, Aavin (TCMPF){" "}
            <span className="footer-dot">•</span> v1.0.0
          </span>
        </footer>
      </main>

      {/* Floating RAG Chatbot Quick Action Button */}
      {location.pathname !== "/chatbot" && (
        <Link
          to="/chatbot"
          className="floating-chat-btn"
          title="Ask ClearPathAI Assistant"
        >
          <MessageSquare size={20} />
          <span>Dairy AI Assist</span>
          <Sparkles size={14} className="sparkle-icon" />
        </Link>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
