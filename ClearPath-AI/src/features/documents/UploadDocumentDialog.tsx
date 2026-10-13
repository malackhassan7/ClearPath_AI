import { useEffect, useId, useState } from "react";
import { ArrowRight, ShieldCheck, Upload, X } from "lucide-react";
import { userMessage } from "@/api/client";
import type { PageProps } from "@/app/pageProps";
import { DOCUMENT_TYPES, LICENSE_TIERS, validateFile } from "./fileRules";

type Props = Pick<
  PageProps,
  "projects" | "clearances" | "onUploadDocument" | "onCreateApplication"
> & {
  defaultProjectId?: string;
  live: boolean;
  onClose: () => void;
};

export function UploadDocumentDialog({
  projects,
  clearances,
  onUploadDocument,
  onCreateApplication,
  defaultProjectId,
  live,
  onClose,
}: Props) {
  const uid = useId();
  const [projectId, setProjectId] = useState(
    defaultProjectId ?? projects[0]?.id ?? "",
  );
  const [applicationId, setApplicationId] = useState("new");
  const [tier, setTier] = useState<string>(LICENSE_TIERS[0][0]);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(DOCUMENT_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  // Synchronize projectId if projects load asynchronously
  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(defaultProjectId ?? projects[0].id);
    }
  }, [projects, defaultProjectId, projectId]);

  const apps = clearances.filter((c) => c.projectId === projectId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);
  useEffect(() => setApplicationId(apps[0]?.id ?? "new"), [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!projectId)
      return setError("Create a project first, then upload documents for it.");
    if (name.trim().length < 2) return setError("Enter a document name.");
    const fileError = validateFile(file);
    if (fileError) return setError(fileError);
    setBusy(true);
    setError("");
    setProgress(0);
    try {
      const appId =
        applicationId === "new"
          ? await onCreateApplication({
              projectId,
              applicationType: "FSSAI",
              licenseTier: tier,
            })
          : applicationId;
      await onUploadDocument({
        applicationId: appId,
        documentName: name.trim(),
        documentType: type,
        file: file as File,
        onProgress: setProgress,
      });
      onClose();
    } catch (e) {
      setError(userMessage(e)); // user can simply press Upload again to retry
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
      >
        <div className="modal-head">
          <div>
            <div className="eyebrow">DOCUMENT UPLOAD</div>
            <h2 id={`${uid}-title`}>Upload a document</h2>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="privacy-banner">
            <ShieldCheck size={17} />
            <div>
              <b>{live ? "Stored on the server" : "Demo mode"}</b>
              <p>
                {live
                  ? "Files are saved on this application's server. Do not upload real Aadhaar, PAN or bank documents. Validation service not connected."
                  : "Only the file name is kept in this browser. No file is sent anywhere."}
              </p>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor={`${uid}-project`}>Project</label>
            <select
              id={`${uid}-project`}
              className="form-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={busy}
            >
              {projects.length === 0 && (
                <option value="">No projects yet</option>
              )}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor={`${uid}-app`}>Application</label>
            <select
              id={`${uid}-app`}
              className="form-select"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              disabled={busy}
            >
              {apps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="new">
                + Start a new FSSAI application (draft)
              </option>
            </select>
          </div>
          {applicationId === "new" && (
            <div className="form-group">
              <label htmlFor={`${uid}-tier`}>FSSAI licence type</label>
              <select
                id={`${uid}-tier`}
                className="form-select"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                disabled={busy}
              >
                {LICENSE_TIERS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <small>
                Confirm the correct tier with the FSSAI/FoSCoS guidance before
                applying.
              </small>
            </div>
          )}
          <div className="form-group">
            <label htmlFor={`${uid}-name`}>Document name</label>
            <input
              id={`${uid}-name`}
              className="form-control"
              value={name}
              maxLength={255}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              aria-describedby={error ? `${uid}-err` : undefined}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`${uid}-type`}>Category</label>
            <select
              id={`${uid}-type`}
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={busy}
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <label className="upload-zone">
            <Upload size={22} />
            <b>Choose a file</b>
            <small>PDF, PNG or JPG · maximum 5 MB</small>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              disabled={busy}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError("");
              }}
            />
          </label>
          {file && (
            <p className="file-picked">
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
          {busy && (
            <progress
              value={progress}
              max={100}
              aria-label="Upload progress"
              style={{ width: "100%" }}
            />
          )}
          {error && (
            <p id={`${uid}-err`} className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary full" onClick={submit} disabled={busy}>
            {busy
              ? `Uploading… ${progress}%`
              : error
                ? "Retry upload"
                : "Upload document"}{" "}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
