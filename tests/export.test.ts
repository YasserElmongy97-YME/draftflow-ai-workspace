import { describe, it, expect } from "vitest";
import {
  slugifyFilename,
  toHtmlExport,
  toMarkdownExport,
  toPlainTextExport,
} from "@/lib/export";

const sampleDoc = {
  title: "Zero-Downtime Migrations",
  content: "# Zero-Downtime Migrations\n\nUse **lock_timeout** in production.",
  templateName: "Technical Deep Dive",
  tone: "Technical",
  length: "Short",
  versionNumber: 2,
  updatedAt: "2026-11-24T12:00:00.000Z",
};

describe("export formatters", () => {
  it("creates clean filename slugs", () => {
    expect(slugifyFilename("Zero-Downtime Migrations!")).toBe(
      "zero-downtime-migrations"
    );
  });

  it("includes YAML frontmatter in Markdown export", () => {
    const md = toMarkdownExport(sampleDoc);
    expect(md).toContain('title: "Zero-Downtime Migrations"');
    expect(md).toContain("version: v2");
    expect(md).toContain("Use **lock_timeout** in production.");
  });

  it("renders standalone HTML export", () => {
    const html = toHtmlExport(sampleDoc);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<strong>lock_timeout</strong>");
  });

  it("strips Markdown syntax for plain text export", () => {
    const txt = toPlainTextExport(sampleDoc);
    expect(txt).not.toContain("**");
    expect(txt).not.toContain("# ");
    expect(txt).toContain("Use lock_timeout in production.");
  });
});
