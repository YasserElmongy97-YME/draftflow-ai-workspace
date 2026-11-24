import { renderMarkdownToHtml } from "./markdown";

export interface ExportDocumentInput {
  title: string;
  content: string;
  templateName: string;
  tone: string;
  length: string;
  versionNumber: number;
  updatedAt?: string;
}

export function slugifyFilename(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "draftflow-article";
}

export function toMarkdownExport(doc: ExportDocumentInput): string {
  const dateStr = doc.updatedAt ?? new Date().toISOString();
  const safeTitle = doc.title.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const frontmatter = [
    "---",
    `title: "${safeTitle}"`,
    `template: "${doc.templateName}"`,
    `tone: "${doc.tone}"`,
    `length: "${doc.length}"`,
    `version: v${doc.versionNumber}`,
    `updated: "${dateStr}"`,
    "---",
    "",
  ].join("\n");

  return `${frontmatter}${doc.content.trim()}\n`;
}

export function toHtmlExport(doc: ExportDocumentInput): string {
  const bodyHtml = renderMarkdownToHtml(doc.content);
  const safeTitle = doc.title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    body {
      max-width: 720px;
      margin: 48px auto;
      padding: 0 24px;
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.7;
      color: #18181b;
      background: #fafafa;
    }
    header {
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 12px;
      margin-bottom: 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      color: #71717a;
    }
    h1, h2, h3 { line-height: 1.25; color: #09090b; }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.9em;
      background: #f4f4f5;
      padding: 2px 5px;
      border-radius: 3px;
    }
    pre {
      background: #18181b;
      color: #f4f4f5;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code { background: transparent; padding: 0; color: inherit; }
    blockquote {
      border-left: 3px solid #d97757;
      margin: 20px 0;
      padding-left: 16px;
      color: #52525b;
    }
  </style>
</head>
<body>
  <header>
    ${doc.templateName} &middot; ${doc.tone} &middot; v${doc.versionNumber}
  </header>
  <article>
${bodyHtml}
  </article>
</body>
</html>
`;
}

export function toPlainTextExport(doc: ExportDocumentInput): string {
  return doc.content
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*\n?/g, "").trim())
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^>\s?/gm, "")
    .trim() + "\n";
}
