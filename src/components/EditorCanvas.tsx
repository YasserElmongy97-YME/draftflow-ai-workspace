"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  Save,
  History,
  Download,
  Upload,
  Eye,
  PencilLine,
} from "lucide-react";
import { computeMetrics } from "@/lib/metrics";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { TONES, type RevisionAction, type ToneOption } from "@/lib/validation";

interface EditorCanvasProps {
  title: string;
  onChangeTitle: (val: string) => void;
  content: string;
  onChangeContent: (val: string) => void;
  currentVersionNumber: number | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  onSave: () => void;
  onRevise: (action: RevisionAction, targetTone?: ToneOption) => void;
  onOpenVersions: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  canOpenVersions: boolean;
  rateLimitSeconds: number;
}

const REVISION_BUTTONS: { action: RevisionAction; label: string }[] = [
  { action: "tighten", label: "Tighten" },
  { action: "clarify", label: "Clarify" },
  { action: "expand", label: "Expand" },
  { action: "fix_flow", label: "Fix flow" },
];

export function EditorCanvas({
  title,
  onChangeTitle,
  content,
  onChangeContent,
  currentVersionNumber,
  hasUnsavedChanges,
  isSaving,
  isGenerating,
  onSave,
  onRevise,
  onOpenVersions,
  onOpenImport,
  onOpenExport,
  canOpenVersions,
  rateLimitSeconds,
}: EditorCanvasProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const metrics = useMemo(() => computeMetrics(content), [content]);
  const previewHtml = useMemo(
    () => (mode === "preview" ? renderMarkdownToHtml(content) : ""),
    [content, mode]
  );

  const updateWithHistory = (next: string) => {
    setUndoStack((prev) => [...prev.slice(-24), content]);
    setRedoStack([]);
    onChangeContent(next);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev.slice(-24), content]);
    onChangeContent(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev.slice(-24), content]);
    onChangeContent(next);
  };

  const applyWrap = (prefix: string, suffix = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || "text";
    const next =
      content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    updateWithHistory(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    });
  };

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <header className="flex h-12 items-center justify-between border-b border-hairline px-5">
        <div className="flex items-center gap-3">
          {currentVersionNumber !== null ? (
            <span className="rounded border border-hairline bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-secondary">
              v{currentVersionNumber}
            </span>
          ) : (
            <span className="font-mono text-[11px] text-ink-muted">UNSAVED</span>
          )}
          {hasUnsavedChanges && (
            <span className="font-mono text-[11px] text-accent">Modified</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded border border-hairline bg-panel p-0.5">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium ${
                mode === "edit"
                  ? "bg-surface text-ink-primary"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              <PencilLine className="h-3 w-3" strokeWidth={1.5} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium ${
                mode === "preview"
                  ? "bg-surface text-ink-primary"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              <Eye className="h-3 w-3" strokeWidth={1.5} />
              <span>Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenVersions}
            disabled={!canOpenVersions}
            className="flex items-center gap-1.5 rounded border border-hairline bg-panel px-2.5 py-1.5 text-xs text-ink-secondary hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <History className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Versions</span>
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="flex items-center gap-1.5 rounded border border-hairline bg-panel px-2.5 py-1.5 text-xs text-ink-secondary hover:text-ink-primary"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 rounded border border-hairline bg-panel px-2.5 py-1.5 text-xs text-ink-secondary hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || isGenerating || !content.trim()}
            className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-medium text-canvas transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>{isSaving ? "Saving..." : "Save snapshot"}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-panel/40 px-5 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => applyWrap("**", "**")}
            title="Bold"
            className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary"
          >
            <Bold className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => applyWrap("*", "*")}
            title="Italic"
            className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary"
          >
            <Italic className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => applyWrap("\n## ", "")}
            title="Heading 2"
            className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary"
          >
            <Heading2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => applyWrap("\n- ", "")}
            title="Bullet list"
            className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary"
          >
            <List className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => applyWrap("\n1. ", "")}
            title="Numbered list"
            className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary"
          >
            <ListOrdered className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => applyWrap("\n> ", "")}
            title="Blockquote"
            className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary"
          >
            <Quote className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => applyWrap("`", "`")}
            title="Inline code"
            className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary"
          >
            <Code className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <span className="mx-1 h-3.5 w-px bg-hairline" />
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo"
            className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary disabled:opacity-30"
          >
            <Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo"
            className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary disabled:opacity-30"
          >
            <Redo2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Revise
          </span>
          {REVISION_BUTTONS.map((btn) => (
            <button
              key={btn.action}
              type="button"
              disabled={isGenerating || !content.trim() || rateLimitSeconds > 0}
              onClick={() => onRevise(btn.action)}
              className="rounded border border-hairline bg-surface px-2.5 py-1 text-[11px] text-ink-secondary transition hover:border-ink-muted hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {btn.label}
            </button>
          ))}
          <select
            aria-label="Shift tone"
            defaultValue=""
            disabled={isGenerating || !content.trim() || rateLimitSeconds > 0}
            onChange={(e) => {
              const val = e.target.value as ToneOption | "";
              if (val) {
                onRevise("shift_tone", val);
                e.target.value = "";
              }
            }}
            className="rounded border border-hairline bg-surface px-2 py-1 text-[11px] text-ink-secondary focus:border-ink-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <option value="" disabled>
              Shift tone...
            </option>
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7">
        <div className="mx-auto max-w-3xl">
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Untitled draft"
            className="mb-5 w-full bg-transparent font-serif text-3xl font-medium tracking-tight text-ink-primary placeholder:text-ink-muted focus:outline-none"
          />

          {mode === "edit" ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => updateWithHistory(e.target.value)}
              placeholder="Write directly here, import a .md/.html/.txt file, or configure a brief on the left and generate a draft..."
              className="min-h-[60vh] w-full resize-none bg-transparent font-sans text-[15px] leading-7 text-ink-primary/90 placeholder:text-ink-muted focus:outline-none"
            />
          ) : (
            <div
              className="editorial-preview min-h-[60vh]"
              dangerouslySetInnerHTML={{
                __html:
                  previewHtml ||
                  '<p class="text-ink-muted">Nothing to preview yet.</p>',
              }}
            />
          )}
        </div>
      </div>

      <footer className="flex h-9 items-center justify-between border-t border-hairline bg-panel/60 px-5 font-mono text-[11px] text-ink-muted">
        <div className="flex items-center gap-4">
          <span>{metrics.wordCount} words</span>
          <span>{metrics.charCount} chars</span>
          <span>{metrics.readingTimeMinutes} min read</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{metrics.headingCount} headings</span>
          <span>{metrics.paragraphCount} paragraphs</span>
        </div>
      </footer>
    </main>
  );
}
