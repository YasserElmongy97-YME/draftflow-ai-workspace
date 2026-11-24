import { describe, it, expect } from "vitest";
import { toHtmlExport, toMarkdownExport } from "@/lib/export";
import { parseImportedFile } from "@/lib/import";

const sampleDoc = {
  title: "Zero-Downtime Migrations",
  content: "# Zero-Downtime Migrations\n\nUse **lock_timeout** in production.\n\n## Steps\n\n- Expand\n- Backfill",
  templateName: "Technical Deep Dive",
  tone: "Technical",
  length: "Medium",
  versionNumber: 2,
  updatedAt: "2026-11-24T12:00:00.000Z",
};

describe("import parser & export round-trip", () => {
  it("round-trips exported Markdown with YAML frontmatter", () => {
    const exported = toMarkdownExport(sampleDoc);
    const imported = parseImportedFile("zero-downtime-migrations.md", exported);

    expect(imported.sourceFormat).toBe("md");
    expect(imported.title).toBe("Zero-Downtime Migrations");
    expect(imported.templateName).toBe("Technical Deep Dive");
    expect(imported.tone).toBe("Technical");
    expect(imported.length).toBe("Medium");
    expect(imported.content).toContain("Use **lock_timeout** in production.");
  });

  it("round-trips exported standalone HTML back to clean Markdown", () => {
    const html = toHtmlExport(sampleDoc);
    const imported = parseImportedFile("zero-downtime-migrations.html", html);

    expect(imported.sourceFormat).toBe("html");
    expect(imported.title).toBe("Zero-Downtime Migrations");
    expect(imported.content).toContain("**lock_timeout**");
    expect(imported.content).toContain("## Steps");
    expect(imported.content).toContain("- Expand");
  });

  it("imports plain text files cleanly", () => {
    const imported = parseImportedFile("notes.txt", "Release Checklist\n\nVerify migrations and tests.");
    expect(imported.sourceFormat).toBe("txt");
    expect(imported.title).toBe("Release Checklist");
    expect(imported.content).toContain("Verify migrations and tests.");
  });

  it("rejects unsupported file extensions and empty files", () => {
    expect(() => parseImportedFile("archive.pdf", "binary")).toThrow("Unsupported file type");
    expect(() => parseImportedFile("empty.md", "   ")).toThrow("empty");
  });
});
