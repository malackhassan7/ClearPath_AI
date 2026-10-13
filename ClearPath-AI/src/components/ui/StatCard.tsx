import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "green",
  hint,
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-bottom">
        {delta && (
          <span className="metric-delta">
            <ArrowUpRight size={13} />
            {delta}
          </span>
        )}
        <span>{hint || "Across demo workspace"}</span>
      </div>
    </div>
  );
}
