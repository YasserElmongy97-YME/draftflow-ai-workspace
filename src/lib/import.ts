import { LENGTHS, TONES, type LengthOption, type ToneOption } from "./validation";

export interface ImportedDocument {
  title: string;
  content: string;
  templateName?: string;
  tone?: ToneOption;
  length?: LengthOption;
  sourceFormat: "md" | "html" | "txt";
  fileName: string;
}

const MAX_IMPORT_BYTES = 1_048_576;

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function unescapeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: normalized.trim() };
  }

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    let val = line.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
    meta[key] = val;
  }

  return { meta, body: match[2].trim() };
}

function htmlToMarkdown(html: string): { title?: string; content: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? unescapeHtmlEntities(titleMatch[1].trim()) : undefined;

  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let fragment = articleMatch?.[1] ?? bodyMatch?.[1] ?? html;

  fragment = fragment
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  fragment = fragment.replace(
    /<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_m, code) => `\n\n\`\`\`\n${unescapeHtmlEntities(code.trim())}\n\`\`\`\n\n`
  );

  fragment = fragment.replace(
    /<h1[^>]*>([\s\S]*?)<\/h1>/gi,
    (_m, t) => `\n\n# ${t.trim()}\n\n`
  );
  fragment = fragment.replace(
    /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
    (_m, t) => `\n\n## ${t.trim()}\n\n`
  );
  fragment = fragment.replace(
    /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
    (_m, t) => `\n\n### ${t.trim()}\n\n`
  );
  fragment = fragment.replace(
    /<blockquote[^>]*>\s*(?:<p[^>]*>)?([\s\S]*?)(?:<\/p>)?\s*<\/blockquote>/gi,
    (_m, t) => `\n\n> ${t.trim()}\n\n`
  );

  fragment = fragment.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner) => {
    let idx = 0;
    const items = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_li: string, text: string) => {
      idx += 1;
      return `${idx}. ${text.trim()}\n`;
    });
    return `\n\n${items}\n`;
  });

  fragment = fragment.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner) => {
    const items = inner.replace(
      /<li[^>]*>([\s\S]*?)<\/li>/gi,
      (_li: string, text: string) => `- ${text.trim()}\n`
    );
    return `\n\n${items}\n`;
  });

  fragment = fragment.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, t) => `\n\n${t.trim()}\n\n`);
  fragment = fragment.replace(/<br\s*\/?>/gi, "\n");
  fragment = fragment.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  fragment = fragment.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");
  fragment = fragment.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*");
  fragment = fragment.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*");
  fragment = fragment.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");
  fragment = fragment.replace(
    /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    "[$2]($1)"
  );

  fragment = fragment.replace(/<[^>]+>/g, "");
  fragment = unescapeHtmlEntities(fragment)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { title, content: fragment };
}

export function parseImportedFile(
  fileName: string,
  rawText: string,
  byteSize?: number
): ImportedDocument {
  if (byteSize !== undefined && byteSize > MAX_IMPORT_BYTES) {
    throw new Error("File is too large. Maximum supported size is 1 MB.");
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error("The selected file is empty.");
  }

  const lower = fileName.toLowerCase();
  const fallbackTitle = stripExtension(fileName) || "Imported draft";

  if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    const { meta, body } = parseFrontmatter(trimmed);
    const headingMatch = body.match(/^#\s+(.+)$/m);
    const title = meta.title || headingMatch?.[1]?.trim() || fallbackTitle;

    const tone = TONES.includes(meta.tone as ToneOption)
      ? (meta.tone as ToneOption)
      : undefined;
    const length = LENGTHS.includes(meta.length as LengthOption)
      ? (meta.length as LengthOption)
      : undefined;

    return {
      title,
      content: body,
      templateName: meta.template || undefined,
      tone,
      length,
      sourceFormat: "md",
      fileName,
    };
  }

  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    const { title: htmlTitle, content } = htmlToMarkdown(trimmed);
    if (!content) {
      throw new Error("No readable text content found in HTML file.");
    }
    const headingMatch = content.match(/^#\s+(.+)$/m);
    return {
      title: htmlTitle || headingMatch?.[1]?.trim() || fallbackTitle,
      content,
      sourceFormat: "html",
      fileName,
    };
  }

  if (lower.endsWith(".txt")) {
    const normalized = trimmed.replace(/\r\n/g, "\n");
    const firstLine = normalized.split("\n")[0]?.trim() ?? "";
    const title =
      firstLine.length > 0 && firstLine.length <= 120 ? firstLine : fallbackTitle;

    return {
      title,
      content: normalized,
      sourceFormat: "txt",
      fileName,
    };
  }

  throw new Error("Unsupported file type. Upload a .md, .html, or .txt file.");
}
