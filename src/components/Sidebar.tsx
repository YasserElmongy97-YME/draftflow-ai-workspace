"use client";

import {
  FileText,
  Layers,
  History,
  Download,
  Upload,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import type { ActiveView, ArticleItem } from "./types";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onNewDraft: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  canExport: boolean;
  recentArticles: ArticleItem[];
  activeArticleId: string | null;
  onSelectArticle: (id: string) => void;
  aiMode: "live" | "demo";
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activeView,
  onSelectView,
  onNewDraft,
  onOpenImport,
  onOpenExport,
  canExport,
  recentArticles,
  activeArticleId,
  onSelectArticle,
  aiMode,
}: SidebarProps) {
  const navItems: {
    id: ActiveView;
    label: string;
    icon: typeof FileText;
  }[] = [
    { id: "editor", label: "Workspace", icon: FileText },
    { id: "templates", label: "Templates", icon: Layers },
    { id: "history", label: "History", icon: History },
  ];

  async function handleLockWorkspace() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <aside
      className={`flex flex-col border-r border-hairline bg-panel transition-all duration-150 ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      <div className="flex h-12 items-center justify-between border-b border-hairline px-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-serif text-base font-medium tracking-tight text-ink-primary">
              DraftFlow
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>

      <div className="p-2.5">
        <button
          type="button"
          onClick={onNewDraft}
          className="flex w-full items-center justify-center gap-2 rounded border border-hairline bg-surface px-3 py-2 text-xs font-medium text-ink-primary transition hover:border-ink-muted hover:bg-[#1c1c21]"
        >
          <Plus className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
          {!collapsed && <span>New draft</span>}
        </button>
      </div>

      <nav className="space-y-0.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-xs font-medium transition ${
                active
                  ? "bg-surface text-ink-primary"
                  : "text-ink-secondary hover:bg-surface/60 hover:text-ink-primary"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenImport}
          className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-xs font-medium text-ink-secondary transition hover:bg-surface/60 hover:text-ink-primary"
        >
          <Upload className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && <span>Import</span>}
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          disabled={!canExport}
          className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-xs font-medium text-ink-secondary transition hover:bg-surface/60 hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && <span>Export</span>}
        </button>
      </nav>

      {!collapsed && (
        <div className="mt-5 flex-1 overflow-y-auto px-2.5">
          <div className="mb-2 px-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Recent drafts
          </div>
          {recentArticles.length === 0 ? (
            <p className="px-1.5 text-xs text-ink-muted">No saved drafts yet.</p>
          ) : (
            <div className="space-y-0.5">
              {recentArticles.slice(0, 8).map((art) => (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => onSelectArticle(art.id)}
                  className={`flex w-full flex-col rounded px-2 py-1.5 text-left transition ${
                    activeArticleId === art.id && activeView === "editor"
                      ? "bg-surface text-ink-primary"
                      : "text-ink-secondary hover:bg-surface/50 hover:text-ink-primary"
                  }`}
                >
                  <span className="truncate text-xs font-medium">{art.title}</span>
                  <span className="mt-0.5 font-mono text-[10px] text-ink-muted">
                    v{art.currentVersionNumber} · {art.wordCount}w
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-hairline p-3">
        {!collapsed ? (
          <div className="flex items-center justify-between font-mono text-[10px] text-ink-muted">
            <span>ENGINE</span>
            <span className="rounded border border-hairline bg-surface px-1.5 py-0.5 text-ink-secondary">
              {aiMode === "live" ? "GEMINI LIVE" : "DEMO MODE"}
            </span>
          </div>
        ) : (
          <div
            title={aiMode === "live" ? "Gemini Live" : "Demo Mode"}
            className={`mx-auto h-2 w-2 rounded-full ${
              aiMode === "live" ? "bg-emerald-500" : "bg-ink-muted"
            }`}
          />
        )}
        <button
          type="button"
          onClick={() => void handleLockWorkspace()}
          title="Lock workspace"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded px-2 py-2 text-xs text-ink-muted transition hover:bg-surface hover:text-ink-primary"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
          {!collapsed && <span>Lock workspace</span>}
        </button>
      </div>
    </aside>
  );
}
