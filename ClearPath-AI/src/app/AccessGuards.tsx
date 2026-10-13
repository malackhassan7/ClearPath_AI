import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "@/types";
import { useSession } from "@/app/session";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { signedIn, sessionExpired } = useSession();
  const location = useLocation();
  if (sessionExpired)
    return (
      <Navigate
        to="/session-expired"
        replace
        state={{ from: location.pathname }}
      />
    );
  if (!signedIn)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function RoleGuard({
  children,
  role,
  allowedRoles,
}: {
  children: ReactNode;
  role: Role;
  allowedRoles: Role[];
}) {
  const location = useLocation();
  if (!allowedRoles.includes(role))
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ from: location.pathname, requiredRoles: allowedRoles }}
      />
    );
  return <>{children}</>;
}

const ALL: Role[] = [
  "user",
  "applicant",
  "consultant",
  "officer",
  "admin",
  "farmer",
  "entrepreneur",
];
const REVIEW: Role[] = ["officer", "admin"];

/** Central route policy. Unknown paths are handled by the not-found route UI. */
export function allowedRolesForPath(path: string): Role[] {
  if (path === "/clients" || path.startsWith("/clients/"))
    return ["consultant", "admin"];
  if (path === "/admin/users") return ["admin"];
  if (
    [
      "/admin/review-queue",
      "/admin/rules",
      "/admin/sources",
      "/admin/audit-logs",
    ].includes(path) ||
    path.startsWith("/admin/rules/")
  )
    return REVIEW;
  if (path === "/bottlenecks") return ["consultant", "officer", "admin"];
  if (path === "/projects/new")
    return [
      "user",
      "applicant",
      "consultant",
      "entrepreneur",
      "farmer",
      "admin",
    ];
  if (/^\/projects\/[^/]+\/edit$/.test(path))
    return ["user", "applicant", "consultant", "admin", "entrepreneur"];
  return ALL;
}

export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-user-id",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verify-otp",
  "/account-locked",
  "/unauthorized",
  "/session-expired",
];
