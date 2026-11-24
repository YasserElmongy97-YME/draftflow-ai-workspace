"use client";

import { useRef, useState } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { parseImportedFile, type ImportedDocument } from "@/lib/import";
import { computeMetrics } from "@/lib/metrics";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  hasActiveArticle: boolean;
  onConfirmImport: (doc: ImportedDocument, mode: "new" | "replace") => Promise<void>;
}

export function ImportModal({
  open,
  onClose,
  hasActiveArticle,
  onConfirmImport,
}: ImportModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState<ImportedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"new" | "replace">("new");
  const [importing, setImporting] = useState(false);

  if (!open) return null;

  const resetAndClose = () => {
    setParsed(null);
    setError(null);
    setDragging(false);
    setImportMode("new");
    onClose();
  };

  const handleFile = async (file: File) => {
    setError(null);
    setParsed(null);
    try {
      const text = await file.text();
      const doc = parseImportedFile(file.name, text, file.size);
      setParsed(doc);
    } catch (err) {
      setError((err as Error).message || "Could not parse file.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!parsed) return;
    setImporting(true);
    try {
      await onConfirmImport(parsed, hasActiveArticle ? importMode : "new");
      resetAndClose();
    } finally {
      setImporting(false);
    }
  };

  const metrics = parsed ? computeMetrics(parsed.content) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-lg rounded border border-hairline bg-panel">
        <div className="flex h-12 items-center justify-between border-b border-hairline px-5">
          <span className="text-xs font-medium text-ink-primary">
            Import draft
          </span>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded p-1 text-ink-secondary hover:bg-surface hover:text-ink-primary"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded border border-dashed px-4 py-7 text-center transition ${
              dragging
                ? "border-accent bg-accent/5"
                : "border-hairline bg-surface hover:border-ink-muted"
            }`}
          >
            <Upload className="mb-2 h-5 w-5 text-ink-secondary" strokeWidth={1.5} />
            <p className="text-xs font-medium text-ink-primary">
              Drop a file here or click to browse
            </p>
            <p className="mt-1 font-mono text-[10px] text-ink-muted">
              Supports .md (with YAML frontmatter), .html, and .txt · max 1 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".md,.markdown,.html,.htm,.txt,text/markdown,text/html,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleFile(file);
                }
                e.target.value = "";
              }}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          {parsed && metrics && (
            <div className="space-y-3 rounded border border-hairline bg-canvas p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-ink-primary">
                    {parsed.title}
                  </span>
                </div>
                <span className="rounded border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-ink-muted">
                  .{parsed.sourceFormat}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 font-mono text-[10px] text-ink-muted">
                <span>{metrics.wordCount} words</span>
                <span>{metrics.headingCount} headings</span>
                {parsed.templateName && <span>TEMPLATE: {parsed.templateName}</span>}
                {parsed.tone && <span>TONE: {parsed.tone}</span>}
                {parsed.length && <span>LENGTH: {parsed.length}</span>}
              </div>

              {hasActiveArticle && (
                <div className="border-t border-hairline pt-3">
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Destination
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode("new")}
                      className={`rounded border px-3 py-2 text-left text-xs transition ${
                        importMode === "new"
                          ? "border-accent bg-surface text-ink-primary"
                          : "border-hairline bg-panel text-ink-secondary hover:text-ink-primary"
                      }`}
                    >
                      <div className="font-medium">New draft</div>
                      <div className="mt-0.5 text-[10px] text-ink-muted">
                        Create as standalone v1
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode("replace")}
                      className={`rounded border px-3 py-2 text-left text-xs transition ${
                        importMode === "replace"
                          ? "border-accent bg-surface text-ink-primary"
                          : "border-hairline bg-panel text-ink-secondary hover:text-ink-primary"
                      }`}
                    >
                      <div className="font-medium">Update current</div>
                      <div className="mt-0.5 text-[10px] text-ink-muted">
                        Append new version snapshot
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded border border-hairline bg-surface px-3.5 py-2 text-xs text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parsed || importing}
              onClick={handleSubmit}
              className="rounded bg-ink-primary px-4 py-2 text-xs font-medium text-canvas hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {importing ? "Importing..." : "Import into workspace"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
