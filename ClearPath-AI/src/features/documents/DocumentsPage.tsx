import type { PageProps } from "@/app/pageProps";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  FileText,
  Search,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { StatusBadge, statusMeta } from "@/components/ui/StatusBadge";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DocumentRecord } from "@/types";
import { env } from "@/lib/env";
import { userMessage } from "@/api/client";
import { UploadDocumentDialog } from "./UploadDocumentDialog";
import { validateFile } from "./fileRules";
import { STATUTORY_TEMPLATES, type StatutoryTemplate } from "@/data/statutoryTemplates";
import { TemplateModal } from "@/components/ui/TemplateModal";
import { BookOpen } from "lucide-react";

export function DocumentsPage({
  documents,
  projects,
  clearances,
  projectId,
  documentId,
  role,
  onUpdateDocument,
  onUploadDocument,
  onDeleteDocument,
  onCreateApplication,
  onToast,
}: PageProps & { documentId?: string }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [selected, setSelected] = useState<DocumentRecord | null>(
    () => documents.find((d: DocumentRecord) => d.id === documentId) || null,
  );
  const [queryText, setQueryText] = useState("");
  const [reply, setReply] = useState("");
  const [tab, setTab] = useState("All documents");
  const [activeTemplate, setActiveTemplate] = useState<StatutoryTemplate | null>(null);
  useEffect(() => {
    if (!documentId) return;
    const found = documents.find((d: DocumentRecord) => d.id === documentId);
    if (found) setSelected(found);
  }, [documentId, documents]);
  const list = documents.filter(
    (d: DocumentRecord) =>
      (!projectId || d.projectId === projectId) &&
      `${d.documentName} ${d.projectName} ${d.fileName || ""}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (status === "All statuses" || d.status === status) &&
      (tab === "All documents" ||
        (tab === "Needs attention" &&
          ["not_uploaded", "needs_correction"].includes(d.status)) ||
        (tab === "Validated" && d.status === "validated")),
  );
  const live = !env.useMockApi;
  const canUpload = Boolean(role);
  const [showUpload, setShowUpload] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const close = () => {
    setSelected(null);
    setFile(null);
    setFileError("");
    setConfirmDelete(false);
    setProgress(0);
  };
  const upload = async () => {
    if (!selected || !file) return;
    const problem = validateFile(file);
    if (problem) {
      setFileError(problem);
      return;
    }
    if (!live || !selected.application_id) {
      if (live && !selected.application_id && onCreateApplication && (selected.projectId || (projects[0]?.id))) {
        setBusy(true);
        setProgress(0);
        setFileError("");
        try {
          const targetProjId = selected.projectId || projects[0]?.id;
          const newAppId = await onCreateApplication({
            projectId: targetProjId,
            applicationType: "FSSAI",
            licenseTier: "state_license",
          });
          await onUploadDocument({
            applicationId: newAppId,
            documentName: selected.documentName || selected.name || "Document",
            documentType: selected.category || "General",
            file,
            onProgress: setProgress,
          });
          close();
          return;
        } catch (e) {
          setFileError(userMessage(e));
          setBusy(false);
          return;
        }
      }
      // Demo mode keeps the simulated record update.
      onUpdateDocument(selected.id, {
        fileName: file.name,
        status: "uploaded",
        validationNote:
          "Demo metadata received. No OCR or legal validation has been performed.",
      });
      close();
      return;
    }
    setBusy(true);
    setProgress(0);
    setFileError("");
    try {
      // Replace = store the new version first, then remove the old record, so a failed upload never loses the old file.
      await onUploadDocument({
        applicationId: selected.application_id,
        documentName: selected.documentName || selected.name || "Document",
        documentType: selected.category || "General",
        file,
        onProgress: setProgress,
      });
      try {
        await onDeleteDocument(selected.id);
      } catch {
        onToast(
          "New version uploaded, but the previous version could not be removed.",
        );
      }
      close();
    } catch (e) {
      setFileError(userMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await onDeleteDocument(selected.id);
      close();
    } catch (e) {
      setFileError(userMessage(e));
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="DOCUMENT VAULT"
        title={projectId ? "Project document repository" : "Document centre"}
        subtitle="Track missing items, inspect simulated validation checks, and manage document query threads."
        actions={
          <>
            {canUpload && (
              <button
                className="btn primary"
                onClick={() => setShowUpload(true)}
              >
                <Upload size={16} /> Upload document
              </button>
            )}
            <button
              className="btn secondary"
              onClick={() => setActiveTemplate(STATUTORY_TEMPLATES[0])}
            >
              <BookOpen size={16} /> Official Formats & Templates
            </button>
            <button
              className="btn secondary"
              onClick={() =>
                onToast(
                  live
                    ? "Uploaded files are stored on the application server. Automated verification service inspects statutory structure."
                    : "All file processing is simulated locally; no external upload occurred.",
                )
              }
            >
              <ShieldCheck size={16} />{" "}
              {live ? "Storage info" : "Safe demo mode"}
            </button>
          </>
        }
      />
      <div className="privacy-banner">
        <ShieldCheck size={17} />
        <div>
          <b>{live ? "Privacy notice" : "Privacy-first demo"}</b>
          <p>
            Never upload real Aadhaar, PAN, bank passbooks, signatures, or
            sensitive personal documents.{" "}
            {live
              ? "Uploaded files are saved on the application server; only PDF, PNG or JPG up to 5 MB are accepted."
              : "Selected files are not sent to a server."}
          </p>
        </div>
      </div>
      <div className="doc-tabs">
        {["All documents", "Needs attention", "Validated"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
            <span>
              {t === "All documents"
                ? documents.filter(
                    (d: DocumentRecord) =>
                      !projectId || d.projectId === projectId,
                  ).length
                : t === "Needs attention"
                  ? documents.filter(
                      (d: DocumentRecord) =>
                        (!projectId || d.projectId === projectId) &&
                        ["not_uploaded", "needs_correction"].includes(d.status),
                    ).length
                  : documents.filter(
                      (d: DocumentRecord) =>
                        (!projectId || d.projectId === projectId) &&
                        d.status === "validated",
                    ).length}
            </span>
          </button>
        ))}
      </div>
      <section className="panel data-panel">
        <div className="filter-row">
          <div className="search-field">
            <Search size={17} />
            <input
              placeholder="Search documents or projects…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>All statuses</option>
            {[
              "not_uploaded",
              "uploaded",
              "validated",
              "needs_correction",
              "awaiting_review",
            ].map((x) => (
              <option key={x} value={x}>
                {statusMeta[x]?.label || x}
              </option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>DOCUMENT</th>
                <th>PROJECT</th>
                <th>CATEGORY</th>
                <th>REQUIRED</th>
                <th>VERSION</th>
                <th>STATUS</th>
                <th>VALIDATION NOTE</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((d: DocumentRecord) => (
                <tr key={d.id}>
                  <td>
                    <div className="doc-cell">
                      <span className="doc-icon">
                        <FileText size={17} />
                      </span>
                      <div>
                        <b>{d.documentName}</b>
                        <small>{d.fileName || "No file attached"}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Link
                      className="table-link"
                      to={`/projects/${d.projectId}`}
                    >
                      {d.projectName}
                    </Link>
                  </td>
                  <td>{d.category}</td>
                  <td>
                    {d.mandatory ? (
                      <span className="required-tag">Required</span>
                    ) : (
                      "Optional"
                    )}
                  </td>
                  <td>v{d.version}</td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="next-action-cell">{d.validationNote}</td>
                  <td>
                    <button
                      className="table-arrow"
                      onClick={() => {
                        setSelected(d);
                        setFile(null);
                        setFileError("");
                      }}
                      aria-label={`Inspect ${d.documentName}`}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <EmptyState
            title="No documents found"
            body={
              live
                ? "No uploaded documents match your filters. Use Upload document to add one."
                : "No document records match your filters."
            }
            action={
              <button
                className="btn primary"
                style={{ marginTop: "12px" }}
                onClick={() => setShowUpload(true)}
              >
                <Upload size={16} /> Upload document
              </button>
            }
          />
        )}
        <div className="panel-foot">
          <span>
            {live
              ? "Stored on the server · validation service not connected"
              : "Local simulated document metadata only"}
          </span>
          <span>{list.length} records</span>
        </div>
      </section>
      {selected && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && !busy && close()}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-modal-title"
          >
            <div className="modal-head">
              <div>
                <div className="eyebrow">DOCUMENT INSPECTION</div>
                <h2 id="doc-modal-title">{selected.documentName}</h2>
              </div>
              <button
                className="icon-btn"
                onClick={close}
                disabled={busy}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-list">
                {[
                  ["Project", selected.projectName],
                  ["Category", selected.category],
                  ["Current file", selected.fileName || "No file attached"],
                  ["Version", `v${selected.version}`],
                  [
                    "Current status",
                    statusMeta[selected.status]?.label || selected.status,
                  ],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </div>
                ))}
              </div>
              <div className="screening-note">
                <AlertCircle size={18} />
                <div>
                  <b>Validation limitation</b>
                  <p>
                    {selected.validationNote} A filename and file type check
                    does not establish document authenticity, completeness, or
                    legal acceptance.
                  </p>
                </div>
              </div>
              {canUpload && (
                <>
                  <label className="upload-zone">
                    <Upload size={22} />
                    <b>
                      {live
                        ? "Replace with a new version"
                        : "Replace / attach safe sample file"}
                    </b>
                    <small>
                      {live
                        ? "PDF, PNG or JPG · maximum 5 MB · stored on the server"
                        : "PDF, PNG or JPG · maximum 5 MB · kept in this browser session"}
                    </small>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                      onChange={(e) => {
                        setFile(e.target.files?.[0] || null);
                        setFileError("");
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
                  {fileError && (
                    <p className="form-error" role="alert">
                      {fileError}
                    </p>
                  )}
                  <button
                    className="btn primary full"
                    disabled={!file || busy}
                    onClick={upload}
                  >
                    {busy
                      ? `Uploading… ${progress}%`
                      : live
                        ? "Upload new version"
                        : "Save demo document record"}{" "}
                    <ArrowRight size={16} />
                  </button>
                  {!confirmDelete ? (
                    <button
                      className="btn secondary full"
                      disabled={busy}
                      onClick={() => setConfirmDelete(true)}
                    >
                      Remove this document
                    </button>
                  ) : (
                    <div
                      className="screening-note"
                      role="alertdialog"
                      aria-label="Confirm removal"
                    >
                      <AlertCircle size={18} />
                      <div>
                        <b>Remove “{selected.documentName}”?</b>
                        <p>
                          This deletes the record
                          {live ? " and its stored file" : ""}. It cannot be
                          undone.
                        </p>
                        <button
                          className="btn primary"
                          disabled={busy}
                          onClick={remove}
                        >
                          Yes, remove
                        </button>{" "}
                        <button
                          className="btn secondary"
                          disabled={busy}
                          onClick={() => setConfirmDelete(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {live ? (
                <p className="file-picked">
                  Officer query threads are not available from the backend yet.
                </p>
              ) : (
                <div className="query-box">
                  <b>Query thread (simulation)</b>
                  <p>
                    Illustrative officer query: Please verify that the submitted
                    drawing revision and index are consistent.
                  </p>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a demo response…"
                  />
                  <button
                    className="btn secondary"
                    onClick={() => {
                      if (!reply.trim()) {
                        onToast("Enter a response first");
                        return;
                      }
                      onUpdateDocument(selected.id, {
                        validationNote: `Demo response recorded: ${reply.slice(0, 90)}`,
                      });
                      setSelected(null);
                      setReply("");
                    }}
                  >
                    Record response locally <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showUpload && (
        <UploadDocumentDialog
          projects={projects}
          clearances={clearances}
          onUploadDocument={onUploadDocument}
          onCreateApplication={onCreateApplication}
          defaultProjectId={projectId}
          live={live}
          onClose={() => setShowUpload(false)}
        />
      )}
      {activeTemplate && (
        <TemplateModal
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
          onUpload={() => {
            setActiveTemplate(null);
            setShowUpload(true);
          }}
        />
      )}
    </>
  );
}
