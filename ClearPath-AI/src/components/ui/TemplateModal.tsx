import React, { useState } from "react";
import { Copy, Check, Download, FileText, ShieldCheck, X, Upload } from "lucide-react";
import type { StatutoryTemplate } from "@/data/statutoryTemplates";

interface Props {
  template: StatutoryTemplate;
  onClose: () => void;
  onUpload?: () => void;
}

export function TemplateModal({ template, onClose, onUpload }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(template.sampleText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([template.sampleText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.templateKey}_format.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: "720px", width: "95%" }} role="dialog">
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "rgba(27,108,92,0.1)", padding: "8px", borderRadius: "8px", color: "var(--teal-primary)" }}>
              <FileText size={22} />
            </div>
            <div>
              <div className="eyebrow" style={{ color: "var(--teal-primary)" }}>{template.category.toUpperCase()} · OFFICIAL FORMAT</div>
              <h2 style={{ fontSize: "19px", margin: "2px 0 0" }}>{template.title}</h2>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto", display: "grid", gap: "16px" }}>
          <div style={{ background: "#f8f9fa", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e9ecef" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#14573f", fontWeight: 600 }}>
              <ShieldCheck size={16} /> Statutory Citation & Authority
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#495057" }}>
              <b>{template.authority}:</b> {template.citation}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6c757d" }}>
              {template.description}
            </p>
          </div>

          <div>
            <b style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>Mandatory Particulars Required:</b>
            <ul style={{ margin: 0, paddingLeft: "18px", display: "grid", gap: "4px", fontSize: "13px", color: "#343a40" }}>
              {template.mandatoryFields.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <b style={{ fontSize: "14px" }}>Specimen Template Format:</b>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn secondary" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={handleCopy}>
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Text</>}
                </button>
                <button type="button" className="btn secondary" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={handleDownload}>
                  <Download size={14} /> Download Format
                </button>
              </div>
            </div>
            <pre
              style={{
                background: "#212529",
                color: "#f8f9fa",
                padding: "14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                maxHeight: "260px",
                overflowY: "auto",
                margin: 0,
              }}
            >
              {template.sampleText}
            </pre>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: "1px solid #dee2e6" }}>
            <button type="button" className="btn secondary" onClick={onClose}>
              Close
            </button>
            {onUpload && (
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  onClose();
                  onUpload();
                }}
              >
                <Upload size={16} /> Upload Completed Document
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
