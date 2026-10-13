import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  HelpCircle,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";

export const statusMeta: Record<
  string,
  { label: string; cls: string; icon: LucideIcon }
> = {
  approved: { label: "Approved", cls: "good", icon: CheckCircle2 },
  under_review: { label: "Under review", cls: "info", icon: Clock3 },
  query_raised: { label: "Query raised", cls: "warn", icon: AlertCircle },
  awaiting_applicant: {
    label: "Awaiting applicant",
    cls: "warn",
    icon: Clock3,
  },
  ready_to_apply: { label: "Ready to apply", cls: "good", icon: CheckCircle2 },
  not_started: { label: "Not started", cls: "neutral", icon: Clock3 },
  potentially_applicable: {
    label: "Check applicability",
    cls: "info",
    icon: HelpCircle,
  },
  blocked: { label: "Blocked", cls: "bad", icon: AlertTriangle },
  rejected: { label: "Rejected", cls: "bad", icon: X },
  needs_authority_review: { label: "Authority review", cls: "info", icon: Eye },
  not_applicable: { label: "Not applicable", cls: "neutral", icon: Check },
  applied: { label: "Applied", cls: "info", icon: FileCheck2 },
  awaiting_review: { label: "Awaiting review", cls: "info", icon: Clock3 },
  validated: { label: "Validated (demo)", cls: "good", icon: CheckCircle2 },
  needs_correction: {
    label: "Needs correction",
    cls: "warn",
    icon: AlertCircle,
  },
  not_uploaded: { label: "Not uploaded", cls: "neutral", icon: Upload },
  uploaded: { label: "Uploaded", cls: "info", icon: FileText },
  processing: { label: "Processing", cls: "info", icon: RefreshCw },
  expired: { label: "Expired", cls: "bad", icon: AlertTriangle },
};

export function StatusBadge({ status }: { status: string }) {
  const m = statusMeta[status] || {
    label: status.replaceAll("_", " "),
    cls: "neutral",
    icon: Activity,
  };
  const I = m.icon;
  return (
    <span className={`badge ${m.cls}`} aria-label={`Status: ${m.label}`}>
      <I size={13} />
      {m.label}
    </span>
  );
}
