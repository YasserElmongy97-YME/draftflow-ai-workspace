"use client";

import { useState } from "react";
import { X, Download, Copy, Check } from "lucide-react";
import {
  slugifyFilename,
  toHtmlExport,
  toMarkdownExport,
  toPlainTextExport,
} from "@/lib/export";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  templateName: string;
  tone: string;
  length: string;
  versionNumber: number;
}

export function ExportModal({
  open,
  onClose,
  title,
  content,
  templateName,
  tone,
  length,
  versionNumber,
}: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const doc = {
    title: title || "Untitled draft",
    content,
    templateName,
    tone,
    length,
    versionNumber,
  };

  const triggerDownload = (filename: string, data: string, mime: string) => {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const base = slugifyFilename(doc.title);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(toMarkdownExport(doc));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-md rounded border border-hairline bg-panel">
        <div className="flex h-12 items-center justify-between border-b border-hairline px-5">
          <span className="text-xs font-medium text-ink-primary">
            Export draft
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-secondary hover:bg-surface hover:text-ink-primary"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-2.5 p-5">
          <button
            type="button"
            onClick={() =>
              triggerDownload(
                `${base}.md`,
                toMarkdownExport(doc),
                "text/markdown;charset=utf-8"
              )
            }
            className="flex w-full items-center justify-between rounded border border-hairline bg-surface px-4 py-3 text-left transition hover:border-ink-muted"
          >
            <div>
              <div className="text-xs font-medium text-ink-primary">
                Markdown (.md)
              </div>
              <div className="mt-0.5 text-[11px] text-ink-muted">
                Includes YAML frontmatter with template, tone, and version
              </div>
            </div>
            <Download className="h-4 w-4 text-ink-secondary" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() =>
              triggerDownload(
                `${base}.html`,
                toHtmlExport(doc),
                "text/html;charset=utf-8"
              )
            }
            className="flex w-full items-center justify-between rounded border border-hairline bg-surface px-4 py-3 text-left transition hover:border-ink-muted"
          >
            <div>
              <div className="text-xs font-medium text-ink-primary">
                Standalone HTML (.html)
              </div>
              <div className="mt-0.5 text-[11px] text-ink-muted">
                Clean editorial typography ready for publishing or review
              </div>
            </div>
            <Download className="h-4 w-4 text-ink-secondary" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() =>
              triggerDownload(
                `${base}.txt`,
                toPlainTextExport(doc),
                "text/plain;charset=utf-8"
              )
            }
            className="flex w-full items-center justify-between rounded border border-hairline bg-surface px-4 py-3 text-left transition hover:border-ink-muted"
          >
            <div>
              <div className="text-xs font-medium text-ink-primary">
                Plain text (.txt)
              </div>
              <div className="mt-0.5 text-[11px] text-ink-muted">
                Stripped of Markdown syntax for direct paste
              </div>
            </div>
            <Download className="h-4 w-4 text-ink-secondary" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded border border-hairline bg-canvas px-4 py-2.5 text-xs font-medium text-ink-primary transition hover:border-ink-muted"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={1.75} />
                <span>Copied Markdown</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-ink-secondary" strokeWidth={1.5} />
                <span>Copy Markdown to clipboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
