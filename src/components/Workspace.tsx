"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LengthOption, RevisionAction, ToneOption } from "@/lib/validation";
import type { ImportedDocument } from "@/lib/import";
import { Sidebar } from "./Sidebar";
import { ControlPanel } from "./ControlPanel";
import { EditorCanvas } from "./EditorCanvas";
import { VersionDrawer } from "./VersionDrawer";
import { HistoryView } from "./HistoryView";
import { TemplatesView } from "./TemplatesView";
import { ExportModal } from "./ExportModal";
import { ImportModal } from "./ImportModal";
import type { ActiveView, ArticleItem, TemplateItem, VersionItem } from "./types";

function extractTitleFromMarkdown(md: string, fallback: string): string {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

export function Workspace() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("editor");
  const [aiMode, setAiMode] = useState<"live" | "demo">("demo");

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);

  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [tone, setTone] = useState<ToneOption>("Editorial");
  const [length, setLength] = useState<LengthOption>("Medium");
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [focusKeywords, setFocusKeywords] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [savedTitle, setSavedTitle] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const id = setInterval(() => {
      setRateLimitSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [rateLimitSeconds]);

  const loadInitialData = useCallback(async () => {
    try {
      const [healthRes, tplRes, artRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/templates"),
        fetch("/api/articles"),
      ]);

      if (healthRes.ok) {
        const h = await healthRes.json();
        setAiMode(h.aiMode === "live" ? "live" : "demo");
      }
      if (tplRes.ok) {
        const tData = await tplRes.json();
        const list: TemplateItem[] = tData.templates ?? [];
        setTemplates(list);
        if (list.length > 0) {
          setSelectedTemplateId((prev) => prev || list[0].id);
        }
      }
      if (artRes.ok) {
        const aData = await artRes.json();
        setArticles(aData.articles ?? []);
      }
    } catch {
      showToast("Could not reach backend API.");
    }
  }, [showToast]);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadInitialData();
    }, 0);
    return () => window.clearTimeout(task);
  }, [loadInitialData]);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setTone(tpl.defaultTone);
      setLength(tpl.defaultLength);
    }
  };

  const handleNewDraft = () => {
    setActiveArticleId(null);
    setVersions([]);
    setCurrentVersionNumber(null);
    setTitle("");
    setContent("");
    setSavedTitle("");
    setSavedContent("");
    setTopic("");
    setTargetAudience("");
    setFocusKeywords("");
    setActiveView("editor");
  };

  const handleOpenArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) {
        showToast("Failed to open article.");
        return;
      }
      const data = await res.json();
      const art: ArticleItem = data.article;
      setActiveArticleId(art.id);
      setVersions(data.versions ?? []);
      setCurrentVersionNumber(art.currentVersionNumber);
      setTitle(art.title);
      setContent(art.currentContent);
      setSavedTitle(art.title);
      setSavedContent(art.currentContent);
      setTone(art.tone);
      setLength(art.length);
      setTargetAudience(art.targetAudience);
      setFocusKeywords(art.focusKeywords);
      if (art.templateId) {
        setSelectedTemplateId(art.templateId);
      }
      setActiveView("editor");
    } catch {
      showToast("Error loading article.");
    }
  };

  const persistSnapshot = async (
    nextTitle: string,
    nextContent: string,
    changeLabel: string,
    overrides?: {
      forceNew?: boolean;
      templateId?: string | null;
      templateName?: string;
      tone?: ToneOption;
      length?: LengthOption;
    }
  ) => {
    const activeTpl = templates.find((t) => t.id === selectedTemplateId);
    const effectiveTone = overrides?.tone ?? tone;
    const effectiveLength = overrides?.length ?? length;
    const effectiveTemplateId =
      overrides?.templateId !== undefined
        ? overrides.templateId
        : activeTpl?.id ?? null;
    const effectiveTemplateName =
      overrides?.templateName ?? activeTpl?.name ?? "Editorial Article";

    setIsSaving(true);
    try {
      if (!activeArticleId || overrides?.forceNew) {
        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle || "Untitled draft",
            templateId: effectiveTemplateId,
            templateName: effectiveTemplateName,
            tone: effectiveTone,
            length: effectiveLength,
            targetAudience,
            focusKeywords,
            content: nextContent,
            changeLabel,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          showToast(err.error ?? "Failed to save draft.");
          return;
        }
        const data = await res.json();
        setActiveArticleId(data.article.id);
        setVersions(data.versions ?? []);
        setCurrentVersionNumber(data.article.currentVersionNumber);
        setSavedTitle(data.article.title);
        setSavedContent(data.article.currentContent);
        setArticles((prev) => [data.article, ...prev]);
        showToast(`Saved v${data.article.currentVersionNumber}`);
      } else {
        const res = await fetch(`/api/articles/${activeArticleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle || "Untitled draft",
            content: nextContent,
            changeLabel,
            tone: effectiveTone,
            length: effectiveLength,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          showToast(err.error ?? "Failed to save snapshot.");
          return;
        }
        const data = await res.json();
        setVersions(data.versions ?? []);
        setCurrentVersionNumber(data.article.currentVersionNumber);
        setSavedTitle(data.article.title);
        setSavedContent(data.article.currentContent);
        setArticles((prev) =>
          prev.map((a) => (a.id === data.article.id ? data.article : a))
        );
        showToast(`Saved v${data.article.currentVersionNumber}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportConfirm = async (
    doc: ImportedDocument,
    mode: "new" | "replace"
  ) => {
    const matchedTemplate = doc.templateName
      ? templates.find(
          (t) => t.name.toLowerCase() === doc.templateName?.toLowerCase()
        )
      : undefined;

    if (matchedTemplate) {
      setSelectedTemplateId(matchedTemplate.id);
    }
    if (doc.tone) {
      setTone(doc.tone);
    }
    if (doc.length) {
      setLength(doc.length);
    }

    setTitle(doc.title);
    setContent(doc.content);
    setActiveView("editor");

    await persistSnapshot(
      doc.title,
      doc.content,
      `Imported from ${doc.fileName}`,
      {
        forceNew: mode === "new",
        templateId: matchedTemplate?.id ?? null,
        templateName: doc.templateName ?? matchedTemplate?.name,
        tone: doc.tone,
        length: doc.length,
      }
    );
  };

  const handleGenerate = async () => {
    const activeTpl = templates.find((t) => t.id === selectedTemplateId);
    if (!topic.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setContent("");
    let accumulated = "";

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          topic,
          templateName: activeTpl?.name ?? "Editorial Article",
          templateInstruction:
            activeTpl?.systemInstruction ??
            "Write a clear, structured editorial article.",
          tone,
          length,
          targetAudience,
          focusKeywords,
        }),
      });

      if (res.status === 429) {
        const err = await res.json();
        setRateLimitSeconds(err.retryAfterSeconds ?? 30);
        showToast(err.error ?? "Rate limit reached.");
        return;
      }

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Generation failed.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }

      const derivedTitle = extractTitleFromMarkdown(accumulated, topic.slice(0, 80));
      setTitle(derivedTitle);
      await persistSnapshot(derivedTitle, accumulated, "Initial AI draft");
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        showToast("Generation stopped.");
      } else {
        showToast("Network error during generation.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevise = async (action: RevisionAction, targetTone?: ToneOption) => {
    if (!content.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    let accumulated = "";

    try {
      const res = await fetch("/api/ai/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          content,
          action,
          targetTone,
        }),
      });

      if (res.status === 429) {
        const err = await res.json();
        setRateLimitSeconds(err.retryAfterSeconds ?? 30);
        showToast(err.error ?? "Rate limit reached.");
        return;
      }

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Revision failed.");
        return;
      }

      const revisionLabel =
        res.headers.get("X-Revision-Label") ?? `Revision: ${action}`;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }

      const nextTitle = title || extractTitleFromMarkdown(accumulated, "Revised draft");
      await persistSnapshot(nextTitle, accumulated, revisionLabel);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        showToast("Revision request failed.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!activeArticleId) return;
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/articles/${activeArticleId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) {
        showToast("Failed to restore version.");
        return;
      }
      const data = await res.json();
      setVersions(data.versions ?? []);
      setCurrentVersionNumber(data.article.currentVersionNumber);
      setTitle(data.article.title);
      setContent(data.article.currentContent);
      setSavedTitle(data.article.title);
      setSavedContent(data.article.currentContent);
      setArticles((prev) =>
        prev.map((a) => (a.id === data.article.id ? data.article : a))
      );
      setVersionsOpen(false);
      showToast(`Restored as v${data.article.currentVersionNumber}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      if (activeArticleId === id) {
        handleNewDraft();
      }
      showToast("Draft deleted.");
    }
  };

  const handleCreateTemplate = async (payload: {
    name: string;
    description: string;
    systemInstruction: string;
    defaultTone: ToneOption;
    defaultLength: LengthOption;
  }) => {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setTemplates((prev) => [...prev, data.template]);
      showToast("Template created.");
    } else {
      const err = await res.json();
      showToast(err.error ?? "Could not create template.");
    }
  };

  const handleUpdateTemplate = async (
    id: string,
    payload: {
      name: string;
      description: string;
      systemInstruction: string;
      defaultTone: ToneOption;
      defaultLength: LengthOption;
    }
  ) => {
    const res = await fetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? data.template : t))
      );
      showToast("Template updated.");
    } else {
      const err = await res.json();
      showToast(err.error ?? "Could not update template.");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      showToast("Template deleted.");
    }
  };

  const hasUnsavedChanges =
    content.trim().length > 0 &&
    (content !== savedContent || title !== savedTitle);

  const activeTemplateName =
    templates.find((t) => t.id === selectedTemplateId)?.name ??
    "Editorial Article";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-ink-primary">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        activeView={activeView}
        onSelectView={setActiveView}
        onNewDraft={handleNewDraft}
        onOpenImport={() => setImportOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        canExport={content.trim().length > 0}
        recentArticles={articles}
        activeArticleId={activeArticleId}
        onSelectArticle={handleOpenArticle}
        aiMode={aiMode}
      />

      {activeView === "editor" && (
        <>
          <ControlPanel
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={handleSelectTemplate}
            tone={tone}
            onChangeTone={setTone}
            length={length}
            onChangeLength={setLength}
            topic={topic}
            onChangeTopic={setTopic}
            targetAudience={targetAudience}
            onChangeTargetAudience={setTargetAudience}
            focusKeywords={focusKeywords}
            onChangeFocusKeywords={setFocusKeywords}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            onStop={() => abortRef.current?.abort()}
            rateLimitSeconds={rateLimitSeconds}
          />
          <EditorCanvas
            title={title}
            onChangeTitle={setTitle}
            content={content}
            onChangeContent={setContent}
            currentVersionNumber={currentVersionNumber}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            isGenerating={isGenerating}
            onSave={() => persistSnapshot(title, content, "Manual save")}
            onRevise={handleRevise}
            onOpenVersions={() => setVersionsOpen(true)}
            onOpenImport={() => setImportOpen(true)}
            onOpenExport={() => setExportOpen(true)}
            canOpenVersions={versions.length > 0}
            rateLimitSeconds={rateLimitSeconds}
          />
        </>
      )}

      {activeView === "history" && (
        <HistoryView
          articles={articles}
          onOpenArticle={handleOpenArticle}
          onDeleteArticle={handleDeleteArticle}
        />
      )}

      {activeView === "templates" && (
        <TemplatesView
          templates={templates}
          onCreateTemplate={handleCreateTemplate}
          onUpdateTemplate={handleUpdateTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onUseTemplate={(id) => {
            handleSelectTemplate(id);
            setActiveView("editor");
          }}
        />
      )}

      {versionsOpen && <VersionDrawer
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        versions={versions}
        currentVersionNumber={currentVersionNumber ?? 1}
        onRestore={handleRestoreVersion}
        isRestoring={isRestoring}
      />}

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        hasActiveArticle={activeArticleId !== null}
        onConfirmImport={handleImportConfirm}
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={title}
        content={content}
        templateName={activeTemplateName}
        tone={tone}
        length={length}
        versionNumber={currentVersionNumber ?? 1}
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded border border-hairline bg-surface px-3.5 py-2 font-mono text-xs text-ink-primary">
          {toast}
        </div>
      )}
    </div>
  );
}
