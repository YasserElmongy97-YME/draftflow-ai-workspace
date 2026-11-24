"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { LENGTHS, TONES, type LengthOption, type ToneOption } from "@/lib/validation";
import type { TemplateItem } from "./types";

interface TemplatePayload {
  name: string;
  description: string;
  systemInstruction: string;
  defaultTone: ToneOption;
  defaultLength: LengthOption;
}

interface TemplatesViewProps {
  templates: TemplateItem[];
  onCreateTemplate: (payload: TemplatePayload) => Promise<void>;
  onUpdateTemplate: (id: string, payload: TemplatePayload) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onUseTemplate: (id: string) => void;
}

export function TemplatesView({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onUseTemplate,
}: TemplatesViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemInstruction, setSystemInstruction] = useState("");
  const [defaultTone, setDefaultTone] = useState<ToneOption>("Editorial");
  const [defaultLength, setDefaultLength] = useState<LengthOption>("Medium");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setSystemInstruction("");
    setDefaultTone("Editorial");
    setDefaultLength("Medium");
  };

  const startEdit = (t: TemplateItem) => {
    setEditingId(t.id);
    setName(t.name);
    setDescription(t.description);
    setSystemInstruction(t.systemInstruction);
    setDefaultTone(t.defaultTone);
    setDefaultLength(t.defaultLength);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !systemInstruction.trim()) return;
    setSubmitting(true);
    try {
      const payload: TemplatePayload = {
        name: name.trim(),
        description: description.trim(),
        systemInstruction: systemInstruction.trim(),
        defaultTone,
        defaultLength,
      };
      if (editingId) {
        await onUpdateTemplate(editingId, payload);
      } else {
        await onCreateTemplate(payload);
      }
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <header className="flex h-12 items-center justify-between border-b border-hairline px-6">
        <h1 className="text-sm font-medium text-ink-primary">
          Prompt templates
        </h1>
        <span className="font-mono text-[11px] text-ink-muted">
          {templates.length} available
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className="rounded border border-hairline bg-panel p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-medium text-ink-primary">
                        {t.name}
                      </h2>
                      <span className="rounded border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                        {t.isBuiltIn ? "BUILT-IN" : "CUSTOM"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-secondary">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUseTemplate(t.id)}
                      className="rounded border border-hairline bg-surface px-2.5 py-1 text-[11px] text-ink-primary hover:border-ink-muted"
                    >
                      Use
                    </button>
                    {!t.isBuiltIn && (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          aria-label="Edit template"
                          className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTemplate(t.id)}
                          aria-label="Delete template"
                          className="rounded p-1 text-ink-muted hover:bg-surface hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-ink-muted">
                  <span>TONE: {t.defaultTone.toUpperCase()}</span>
                  <span>LENGTH: {t.defaultLength.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="h-fit space-y-3 rounded border border-hairline bg-panel p-4"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
                <h2 className="text-xs font-medium text-ink-primary">
                  {editingId ? "Edit custom template" : "New custom template"}
                </h2>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="font-mono text-[10px] text-ink-muted hover:text-ink-primary"
                >
                  Cancel
                </button>
              )}
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-ink-muted">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Incident Postmortem"
                className="w-full rounded border border-hairline bg-surface px-2.5 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-ink-muted focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-ink-muted">
                Description
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary of when to use it"
                className="w-full rounded border border-hairline bg-surface px-2.5 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-ink-muted focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase text-ink-muted">
                  Default tone
                </label>
                <select
                  value={defaultTone}
                  onChange={(e) => setDefaultTone(e.target.value as ToneOption)}
                  className="w-full rounded border border-hairline bg-surface px-2 py-2 text-xs text-ink-primary focus:outline-none"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase text-ink-muted">
                  Default length
                </label>
                <select
                  value={defaultLength}
                  onChange={(e) =>
                    setDefaultLength(e.target.value as LengthOption)
                  }
                  className="w-full rounded border border-hairline bg-surface px-2 py-2 text-xs text-ink-primary focus:outline-none"
                >
                  {LENGTHS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-ink-muted">
                System instruction
              </label>
              <textarea
                rows={4}
                required
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                placeholder="Structure, sections, and editorial constraints..."
                className="w-full resize-none rounded border border-hairline bg-surface px-2.5 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-ink-muted focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-ink-primary py-2 text-xs font-medium text-canvas hover:bg-white disabled:opacity-40"
            >
              {submitting
                ? editingId
                  ? "Saving..."
                  : "Creating..."
                : editingId
                ? "Save template"
                : "Create template"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
