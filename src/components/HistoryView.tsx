"use client";

import { useState } from "react";
import { Search, Trash2, ArrowUpRight } from "lucide-react";
import { TONES } from "@/lib/validation";
import type { ArticleItem } from "./types";

interface HistoryViewProps {
  articles: ArticleItem[];
  onOpenArticle: (id: string) => void;
  onDeleteArticle: (id: string) => void;
}

export function HistoryView({
  articles,
  onOpenArticle,
  onDeleteArticle,
}: HistoryViewProps) {
  const [query, setQuery] = useState("");
  const [toneFilter, setToneFilter] = useState("All");

  const filtered = articles.filter((a) => {
    const matchesQuery =
      !query.trim() ||
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.templateName.toLowerCase().includes(query.toLowerCase());
    const matchesTone = toneFilter === "All" || a.tone === toneFilter;
    return matchesQuery && matchesTone;
  });

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <header className="flex h-12 items-center justify-between border-b border-hairline px-6">
        <h1 className="text-sm font-medium text-ink-primary">
          Article history
        </h1>
        <span className="font-mono text-[11px] text-ink-muted">
          {filtered.length} of {articles.length} drafts
        </span>
      </header>

      <div className="flex items-center gap-3 border-b border-hairline bg-panel/40 px-6 py-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-muted"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or template..."
            className="w-full rounded border border-hairline bg-surface py-2 pl-9 pr-3 text-xs text-ink-primary placeholder:text-ink-muted focus:border-ink-muted focus:outline-none"
          />
        </div>

        <select
          value={toneFilter}
          onChange={(e) => setToneFilter(e.target.value)}
          className="rounded border border-hairline bg-surface px-3 py-2 text-xs text-ink-primary focus:border-ink-muted focus:outline-none"
        >
          <option value="All">All tones</option>
          {TONES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="rounded border border-hairline bg-panel p-8 text-center text-xs text-ink-muted">
            No matching articles found.
          </div>
        ) : (
          <div className="overflow-hidden rounded border border-hairline">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-hairline bg-panel font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">Template</th>
                  <th className="px-4 py-2.5">Tone</th>
                  <th className="px-4 py-2.5">Version</th>
                  <th className="px-4 py-2.5">Words</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline bg-canvas">
                {filtered.map((art) => (
                  <tr
                    key={art.id}
                    className="transition hover:bg-panel/70"
                  >
                    <td className="px-4 py-3 font-medium text-ink-primary">
                      {art.title}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">
                      {art.templateName}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{art.tone}</td>
                    <td className="px-4 py-3 font-mono text-ink-secondary">
                      v{art.currentVersionNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-muted">
                      {art.wordCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenArticle(art.id)}
                          className="inline-flex items-center gap-1 rounded border border-hairline bg-surface px-2.5 py-1 text-[11px] text-ink-primary hover:border-ink-muted"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteArticle(art.id)}
                          aria-label="Delete article"
                          className="rounded p-1 text-ink-muted hover:bg-surface hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
