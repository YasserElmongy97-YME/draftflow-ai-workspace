"use client";

import { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import type { VersionItem } from "./types";

interface VersionDrawerProps {
  open: boolean;
  onClose: () => void;
  versions: VersionItem[];
  currentVersionNumber: number;
  onRestore: (versionId: string) => void;
  isRestoring: boolean;
}

export function VersionDrawer({
  open,
  onClose,
  versions,
  currentVersionNumber,
  onRestore,
  isRestoring,
}: VersionDrawerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!open) return null;

  const activeVersion =
    versions.find((v) => v.id === selectedId) ?? versions[0] ?? null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60">
      <div className="flex h-full w-full max-w-2xl border-l border-hairline bg-panel">
        <div className="flex w-64 flex-col border-r border-hairline">
          <div className="flex h-12 items-center justify-between border-b border-hairline px-4">
            <span className="text-xs font-medium text-ink-primary">
              Version history
            </span>
            <span className="font-mono text-[10px] text-ink-muted">
              {versions.length} snapshots
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {versions.map((v) => {
              const isSelected = activeVersion?.id === v.id;
              const isCurrent = v.versionNumber === currentVersionNumber;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={`mb-1 flex w-full flex-col rounded border px-3 py-2 text-left transition ${
                    isSelected
                      ? "border-ink-muted bg-surface"
                      : "border-transparent hover:bg-surface/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-ink-primary">
                      v{v.versionNumber}
                    </span>
                    {isCurrent && (
                      <span className="font-mono text-[10px] text-accent">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <span className="mt-1 text-xs text-ink-secondary">
                    {v.changeLabel}
                  </span>
                  <span className="mt-1 font-mono text-[10px] text-ink-muted">
                    {v.wordCount}w ·{" "}
                    {new Date(v.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex h-12 items-center justify-between border-b border-hairline px-5">
            <div className="flex items-center gap-2">
              {activeVersion && (
                <span className="font-mono text-xs text-ink-secondary">
                  Inspecting v{activeVersion.versionNumber} ·{" "}
                  {activeVersion.changeLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeVersion &&
                activeVersion.versionNumber !== currentVersionNumber && (
                  <button
                    type="button"
                    disabled={isRestoring}
                    onClick={() => onRestore(activeVersion.id)}
                    className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-medium text-canvas hover:bg-accent-hover disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>{isRestoring ? "Restoring..." : "Restore as new"}</span>
                  </button>
                )}
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeVersion ? (
              <div>
                <h3 className="mb-4 font-serif text-xl text-ink-primary">
                  {activeVersion.title}
                </h3>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-ink-secondary">
                  {activeVersion.content}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-ink-muted">No versions available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
