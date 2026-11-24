import { describe, it, expect } from "vitest";
import { createTemplateSchema, generateRequestSchema } from "@/lib/validation";

describe("validation schemas", () => {
  it("rejects short topics in generateRequestSchema", () => {
    const parsed = generateRequestSchema.safeParse({
      topic: "Hi",
      templateName: "Editorial Article",
      templateInstruction: "Write clearly.",
      tone: "Direct",
      length: "Short",
    });
    expect(parsed.success).toBe(false);
  });

  it("validates custom template creation", () => {
    const parsed = createTemplateSchema.safeParse({
      name: "Incident Postmortem",
      description: "Structured post-incident engineering summary",
      systemInstruction: "Include timeline, root cause, and action items.",
      defaultTone: "Technical",
      defaultLength: "Medium",
    });
    expect(parsed.success).toBe(true);
  });
});
