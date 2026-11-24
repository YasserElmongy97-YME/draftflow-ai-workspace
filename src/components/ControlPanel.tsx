"use client";

import { SlidersHorizontal, Square, ArrowRight } from "lucide-react";
import { LENGTHS, TONES, type LengthOption, type ToneOption } from "@/lib/validation";
import type { TemplateItem } from "./types";

interface ControlPanelProps {
  templates: TemplateItem[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  tone: ToneOption;
  onChangeTone: (tone: ToneOption) => void;
  length: LengthOption;
  onChangeLength: (length: LengthOption) => void;
  topic: string;
  onChangeTopic: (val: string) => void;
  targetAudience: string;
  onChangeTargetAudience: (val: string) => void;
  focusKeywords: string;
  onChangeFocusKeywords: (val: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onStop: () => void;
  rateLimitSeconds: number;
}

export function ControlPanel({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  tone,
  onChangeTone,
  length,
  onChangeLength,
  topic,
  onChangeTopic,
  targetAudience,
  onChangeTargetAudience,
  focusKeywords,
  onChangeFocusKeywords,
  isGenerating,
  onGenerate,
  onStop,
  rateLimitSeconds,
}: ControlPanelProps) {
  const activeTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <section className="flex w-80 shrink-0 flex-col border-r border-hairline bg-panel/60">
      <div className="flex h-12 items-center gap-2 border-b border-hairline px-4">
        <SlidersHorizontal className="h-3.5 w-3.5 text-ink-secondary" strokeWidth={1.5} />
        <h2 className="text-xs font-medium tracking-wide text-ink-primary">
          Draft brief
        </h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Prompt template
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="w-full rounded border border-hairline bg-surface px-2.5 py-2 text-xs text-ink-primary focus:border-ink-muted focus:outline-none"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {activeTemplate && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-secondary">
              {activeTemplate.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => onChangeTone(e.target.value as ToneOption)}
              className="w-full rounded border border-hairline bg-surface px-2.5 py-2 text-xs text-ink-primary focus:border-ink-muted focus:outline-none"
            >
              {TONES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              Length
            </label>
            <select
              value={length}
              onChange={(e) => onChangeLength(e.target.value as LengthOption)}
              className="w-full rounded border border-hairline bg-surface px-2.5 py-2 text-xs text-ink-primary focus:border-ink-muted focus:outline-none"
            >
              {LENGTHS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Topic / Angle
          </label>
          <textarea
            rows={4}
            value={topic}
            onChange={(e) => onChangeTopic(e.target.value)}
            placeholder="e.g. Why database lock timeouts prevent cascading outages during migrations"
            className="w-full resize-none rounded border border-hairline bg-surface px-3 py-2 text-xs leading-relaxed text-ink-primary placeholder:text-ink-muted focus:border-ink-muted focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Target audience
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => onChangeTargetAudience(e.target.value)}
            placeholder="e.g. Backend engineers, engineering leads"
            className="w-full rounded border border-hairline bg-surface px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-ink-muted focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Focus keywords
          </label>
          <input
            type="text"
            value={focusKeywords}
            onChange={(e) => onChangeFocusKeywords(e.target.value)}
            placeholder="Comma-separated terms"
            className="w-full rounded border border-hairline bg-surface px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-ink-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="border-t border-hairline p-4">
        {rateLimitSeconds > 0 && (
          <div className="mb-2.5 rounded border border-accent/40 bg-accent/10 px-2.5 py-1.5 font-mono text-[11px] text-accent">
            Rate limit active · retry in {rateLimitSeconds}s
          </div>
        )}

        {isGenerating ? (
          <button
            type="button"
            onClick={onStop}
            className="flex w-full items-center justify-center gap-2 rounded border border-hairline bg-surface px-3 py-2.5 text-xs font-medium text-ink-primary hover:bg-[#1e1e24]"
          >
            <Square className="h-3.5 w-3.5 fill-current text-accent" />
            <span>Stop generation</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onGenerate}
            disabled={!topic.trim() || rateLimitSeconds > 0}
            className="flex w-full items-center justify-center gap-2 rounded bg-ink-primary px-3 py-2.5 text-xs font-medium text-canvas transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Generate draft</span>
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </section>
  );
}
