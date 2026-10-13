import type { Role } from "@/types";

export function money(n: number) {
  return n >= 1000 ? `₹${(n / 100).toFixed(1)} Cr` : `₹${n} L`;
}

export function pct(n: number) {
  return `${n}%`;
}

export function useParamsSafe(path: string) {
  const parts = path.split("/").filter(Boolean);
  return { projectId: parts[1], itemId: parts[1] };
}

export function roleLabel(r: Role) {
  const map: Record<Role, string> = {
    user: "User / Dairy Stakeholder",
    farmer: "Dairy Farmer / Producer",
    entrepreneur: "Dairy Entrepreneur",
    applicant: "Dairy Entrepreneur",
    consultant: "Compliance Consultant",
    officer: "Regulatory Review Officer",
    admin: "System Administrator",
  };
  return map[r] || "Dairy Stakeholder";
}

export function pageName(path: string) {
  if (path === "/") return "Overview";
  const x = path.split("/").filter(Boolean).pop() || "Overview";
  return x
    .replaceAll("-", " ")
    .replace(/\b\w/g, (s) => s.toUpperCase())
    .replace("Admin", "Administration");
}
