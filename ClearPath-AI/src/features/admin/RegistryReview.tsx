import { useState } from "react";
import { registryApi, transitions, type ReviewRecord, type ReviewState } from "@/api/registry";
import { userMessage } from "@/api/client";

export function RegistryReview({ kind, record, onSaved }: {kind: "source" | "rule"; record: ReviewRecord; onSaved: () => void}) {
  const [reason, setReason] = useState("");
  const [conflict, setConflict] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (operation: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { await operation(); setReason(""); onSaved(); }
    catch (e) { setError(userMessage(e)); }
    finally { setBusy(false); }
  };
  return <div>
    <label>Review reason (required)<textarea className="form-control" value={reason} onChange={e => setReason(e.target.value)} /></label>
    <div className="filter-row">{transitions[record.state].map((state: ReviewState) => <button className="btn secondary" key={state} disabled={busy || reason.trim().length < 10 || (state === "VERIFIED" && !!record.conflict_note)} onClick={() => void save(() => registryApi.review(kind, record, state, reason))}>{state === "VERIFIED" ? "Verify evidence (not legal approval)" : `Move to ${state}`}</button>)}</div>
    {record.state !== "SUPERSEDED" && <>
      <label>Conflict description<textarea className="form-control" value={conflict} onChange={e => setConflict(e.target.value)} /></label>
      <button className="btn secondary" disabled={busy || reason.trim().length < 10 || conflict.trim().length < 10} onClick={() => void save(() => registryApi.conflict(kind, record.id, conflict, reason))}>Flag conflict</button>
      {record.conflict_note && <button className="btn secondary" disabled={busy || reason.trim().length < 10} onClick={() => void save(() => registryApi.conflict(kind, record.id, null, reason))}>Resolve conflict with reason</button>}
    </>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
