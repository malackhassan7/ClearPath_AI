import type { Role } from "@/types";

export const users: Record<
  Role,
  { name: string; email: string; org: string; initials: string }
> = {
  user: {
    name: "Anitha Suresh",
    email: "anitha@dairyventure.example",
    org: "Anitha Fresh Dairy Ventures",
    initials: "AS",
  },
  officer: {
    name: "K. Meenakshi",
    email: "meenakshi@fssai-tn.example",
    org: "FSSAI Tamil Nadu Regional Review Desk",
    initials: "KM",
  },
  admin: {
    name: "System Administrator",
    email: "admin@dairysetu.example",
    org: "DairySetu-TN Platform Management",
    initials: "SA",
  },
  farmer: {
    name: "Anitha Suresh",
    email: "anitha@dairyventure.example",
    org: "Anitha Fresh Dairy Ventures",
    initials: "AS",
  },
  entrepreneur: {
    name: "Anitha Suresh",
    email: "anitha@dairyventure.example",
    org: "Anitha Fresh Dairy Ventures",
    initials: "AS",
  },
  applicant: {
    name: "Anitha Suresh",
    email: "anitha@dairyventure.example",
    org: "Anitha Fresh Dairy Ventures",
    initials: "AS",
  },
  consultant: {
    name: "Priya Raman",
    email: "priya@dairysetu.example",
    org: "DairySetu Compliance Advisory",
    initials: "PR",
  },
};

export const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      ["/dashboard", "Overview", "LayoutDashboard"],
      ["/projects", "Dairy projects", "Briefcase"],
      ["/clearances", "FSSAI tracker", "ClipboardCheck"],
      ["/documents", "Document vault", "Files"],
      ["/brands", "Brand comparison", "Tag"],
      ["/districts", "District finder", "MapPin"],
      ["/schemes", "Govt schemes", "BadgePercent"],
      ["/chatbot", "AI compliance bot", "MessageSquare"],
      ["/grievances", "Grievances", "AlertCircle"],
      ["/notifications", "Notifications", "Bell"],
    ],
  },
  {
    label: "REGULATORY DESK",
    items: [
      ["/admin/review-queue", "Review queue", "Inbox"],
      ["/admin/rules", "Rules & sources", "BookOpen"],
      ["/admin/users", "User management", "UserCog"],
      ["admin-audit", "Audit trail", "ShieldCheck"],
    ],
  },
  {
    label: "PREFERENCES",
    items: [
      ["/settings/profile", "My profile", "CircleUserRound"],
      ["/settings/security", "Security", "LockKeyhole"],
      ["/settings/organization", "Organization", "Building2"],
      ["/settings/notifications", "Notification settings", "SlidersHorizontal"],
      ["/help", "Help & guidance", "CircleHelp"],
    ],
  },
] as const;
