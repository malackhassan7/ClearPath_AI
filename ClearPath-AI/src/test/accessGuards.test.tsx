import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "@/app/providers";
import { ProtectedRoute, RoleGuard, allowedRolesForPath } from "@/app/AccessGuards";

beforeEach(() => localStorage.clear());

function setup(path: string, role = "applicant", signedIn = true) {
  if (signedIn) {
    localStorage.setItem("cp-auth", "true");
    localStorage.setItem("cp-access-token", "test-token");
    localStorage.setItem("cp-role", role);
    localStorage.setItem("cp-session-expiry", String(Date.now() + 60_000));
  }
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<h1>Login destination</h1>} />
          <Route path="/unauthorized" element={<h1>Unauthorized destination</h1>} />
          <Route path="/session-expired" element={<h1>Expired destination</h1>} />
          <Route path="*" element={<ProtectedRoute><RoleGuard role={role as "applicant" | "consultant" | "officer" | "admin"} allowedRoles={allowedRolesForPath(path)}><h1>Protected content</h1></RoleGuard></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe("Phase 3 route access", () => {
  it("redirects a visitor without a session to login", () => {
    setup("/projects", "applicant", false);
    expect(screen.getByRole("heading", { name: "Login destination" })).toBeInTheDocument();
  });
  it("blocks an applicant from the consultant client directory", () => {
    setup("/clients", "applicant");
    expect(screen.getByRole("heading", { name: "Unauthorized destination" })).toBeInTheDocument();
  });
  it("allows a consultant to enter the client directory", () => {
    setup("/clients", "consultant");
    expect(screen.getByRole("heading", { name: "Protected content" })).toBeInTheDocument();
  });
  it("restricts user management to administrators", () => {
    expect(allowedRolesForPath("/admin/users")).toEqual(["admin"]);
  });
  it("restricts review tools to officers and administrators", () => {
    expect(allowedRolesForPath("/admin/review-queue")).toEqual(["officer", "admin"]);
  });
});
