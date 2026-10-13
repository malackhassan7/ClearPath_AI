import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
} from "lucide-react";

interface GrievanceItem {
  id: string;
  category: string;
  description: string;
  status: "submitted" | "under_review" | "resolved" | "closed";
  createdAt: string;
  resolutionNotes?: string;
}

const INITIAL_GRIEVANCES: GrievanceItem[] = [
  {
    id: "gr-101",
    category: "Payment Delays",
    description:
      "Delay in weekly milk procurement payout for morning shifts between Oct 1 and Oct 7 at Namakkal Union BMC center.",
    status: "under_review",
    createdAt: "2026-10-08 09:30 AM",
    resolutionNotes: "Assigned to District Union Accounts Officer for payout reconciliation.",
  },
  {
    id: "gr-102",
    category: "Quality / SNF Testing Discrepancy",
    description:
      "Automated milko-tester at primary collection center reported 3.2% fat; recalibration requested with standard buffer sample.",
    status: "resolved",
    createdAt: "2026-09-28 11:15 AM",
    resolutionNotes: "Tester recalibrated by quality inspector on 2026-09-29. Differential payment credited.",
  },
];

export function GrievancePage(): JSX.Element {
  const [grievances, setGrievances] = useState<GrievanceItem[]>(INITIAL_GRIEVANCES);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Payment Delays");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      const newGr: GrievanceItem = {
        id: `gr-${Date.now().toString().slice(-4)}`,
        category,
        description: description.trim(),
        status: "submitted",
        createdAt: new Date().toLocaleString(),
      };
      setGrievances([newGr, ...grievances]);
      setDescription("");
      setSubmitting(false);
      setShowForm(false);
      setToastMessage("Grievance filed successfully. Docket ID: " + newGr.id);
      setTimeout(() => setToastMessage(null), 4000);
    }, 400);
  };

  const getStatusBadge = (status: GrievanceItem["status"]) => {
    switch (status) {
      case "submitted":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Clock size={12} />
            Submitted
          </span>
        );
      case "under_review":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <Clock size={12} />
            Under Review
          </span>
        );
      case "resolved":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} />
            Resolved
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Closed
          </span>
        );
    }
  };

  return (
    <div className="grievances-page fade-in">
      {/* Header */}
      <div className="page-header mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wide uppercase mb-1">
            <AlertCircle size={15} />
            <span>Redressal Desk & Quality Assurance</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif text-slate-900 font-bold">
            Grievance Redressal
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mt-1">
            Direct dispute resolution for milk procurement payments, SNF/Fat calibration discrepancies,
            chilling center issues, and FSSAI application processing delays.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition shrink-0"
        >
          <Plus size={15} />
          <span>{showForm ? "Cancel" : "File New Grievance"}</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 mb-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-700" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* New Grievance Form Modal/Card */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm mb-6 fade-in">
          <h3 className="font-serif font-bold text-base text-slate-900 mb-3">
            File Formal Grievance
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Grievance Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-border rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Payment Delays">Payment Delays (Milk Procurement / Trade Margins)</option>
                <option value="Quality / SNF Testing Discrepancy">Quality / SNF / Fat Testing Discrepancy</option>
                <option value="Chilling & Cold Chain Issue">Chilling Centre / BMC Cold Chain Malfunction</option>
                <option value="FSSAI Application Delay">FSSAI Clearance Processing Delay</option>
                <option value="Cooperative / Union Dispute">Cooperative Union / Route Disagreement</option>
                <option value="Other">Other Regulatory or Operational Grievance</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Detailed Description & Specific Center / Route
              </label>
              <textarea
                rows={4}
                required
                placeholder="Specify the dates, collection center code, involved milk union, or invoice details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs border border-border rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
              >
                <span>{submitting ? "Submitting..." : "Submit Grievance"}</span>
                <Send size={13} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grievances List */}
      <div className="space-y-4">
        {grievances.map((g) => (
          <div
            key={g.id}
            className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">#{g.id}</span>
                <span className="text-xs font-bold text-slate-800">• {g.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">{g.createdAt}</span>
                {getStatusBadge(g.status)}
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mt-2">{g.description}</p>

            {g.resolutionNotes && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">
                  Officer Action & Resolution Notes:
                </span>
                <p className="text-slate-600">{g.resolutionNotes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
