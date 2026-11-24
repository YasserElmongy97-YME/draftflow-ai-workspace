import { describe, it, expect } from "vitest";
import { buildGenerationPrompt, buildRevisionPrompt } from "@/lib/prompt-builder";

describe("prompt-builder", () => {
  it("composes generation prompt with template, tone, length, and metadata", () => {
    const result = buildGenerationPrompt({
      topic: "PostgreSQL lock timeouts",
      templateName: "Technical Deep Dive",
      templateInstruction: "Include concrete SQL examples.",
      tone: "Technical",
      length: "Medium",
      targetAudience: "Backend engineers",
      focusKeywords: "lock_timeout, migrations",
    });

    expect(result.systemInstruction).toContain("Technical Deep Dive");
    expect(result.systemInstruction).toContain("Tone (Technical)");
    expect(result.systemInstruction).toContain("Length (Medium)");
    expect(result.userPrompt).toContain("PostgreSQL lock timeouts");
    expect(result.userPrompt).toContain("Backend engineers");
    expect(result.userPrompt).toContain("lock_timeout, migrations");
  });

  it("builds targeted revision prompt with label", () => {
    const rev = buildRevisionPrompt("# Draft\n\nSome content.", "tighten");
    expect(rev.label).toBe("Revision: Tighten");
    expect(rev.systemInstruction).toContain("25-30%");
    expect(rev.userPrompt).toBe("# Draft\n\nSome content.");
  });
});
