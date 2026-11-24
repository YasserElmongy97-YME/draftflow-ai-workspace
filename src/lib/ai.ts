import { GoogleGenAI } from "@google/genai";
import { isLiveAiEnabled } from "./env";
import type { GenerationPromptInput } from "./prompt-builder";
import type { RevisionAction, ToneOption } from "./validation";

function buildDemoDraft(input: GenerationPromptInput): string {
  const title = input.topic.trim().replace(/\.$/, "");
  const audienceLine = input.targetAudience?.trim()
    ? `Written specifically for ${input.targetAudience.trim()}, this piece focuses on practical execution rather than abstract theory.`
    : "This draft focuses on practical execution and clear operational trade-offs.";
  const keywordLine = input.focusKeywords?.trim()
    ? `Key themes addressed: ${input.focusKeywords.trim()}.`
    : "";

  const shortBody = `# ${title}

${audienceLine}

## Core Perspective

Teams often overcomplicate ${title.toLowerCase()} by adopting heavy tooling before defining the actual workflow bottleneck. Start with a narrow scope, measure cycle time, and keep every step auditable.

## Practical Next Steps

- Define a single owner for the workflow and document the baseline.
- Automate the repetitive checks first, leaving editorial judgment to people.
- Review outcomes after two weeks and remove anything that adds friction.

${keywordLine}`.trim();

  if (input.length === "Short") {
    return shortBody;
  }

  return `${shortBody}

## Implementation Trade-Offs

Moving from ad-hoc drafts to a repeatable system requires discipline around versioning and review. Without immutable snapshots, small edits quietly overwrite earlier decisions and slow down sign-off.

> Good editorial infrastructure stays invisible until you need to trace why a decision was made.

## Closing Takeaway

Treat content operations with the same rigor as production software: clear inputs, tracked revisions, and portable Markdown outputs.`;
}

function buildDemoRevision(
  content: string,
  action: RevisionAction,
  targetTone?: ToneOption
): string {
  const trimmed = content.trim();
  if (action === "tighten") {
    const paragraphs = trimmed.split(/\n\n+/);
    return paragraphs.slice(0, Math.max(2, paragraphs.length - 1)).join("\n\n");
  }
  if (action === "expand") {
    return `${trimmed}\n\n## Additional Context\n\nIn practice, teams see the strongest gains when they pair structured templates with explicit review checkpoints before publication.`;
  }
  if (action === "shift_tone") {
    return `${trimmed}\n\n*Edited for a ${(targetTone ?? "Direct").toLowerCase()} editorial register.*`;
  }
  return trimmed;
}

export async function* streamGenerateDraft(
  systemInstruction: string,
  userPrompt: string,
  fallbackInput: GenerationPromptInput
): AsyncGenerator<string> {
  if (!isLiveAiEnabled()) {
    const demoText = buildDemoDraft(fallbackInput);
    const chunks = demoText.match(/.{1,48}(\s|$)|\n+/g) ?? [demoText];
    for (const chunk of chunks) {
      yield chunk;
      await new Promise((r) => setTimeout(r, 18));
    }
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContentStream({
    model: "gemini-3.8-flash",
    contents: userPrompt,
    config: {
      systemInstruction,
    },
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

export async function* streamReviseDraft(
  systemInstruction: string,
  userPrompt: string,
  action: RevisionAction,
  targetTone?: ToneOption
): AsyncGenerator<string> {
  if (!isLiveAiEnabled()) {
    const demoText = buildDemoRevision(userPrompt, action, targetTone);
    const chunks = demoText.match(/.{1,48}(\s|$)|\n+/g) ?? [demoText];
    for (const chunk of chunks) {
      yield chunk;
      await new Promise((r) => setTimeout(r, 15));
    }
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContentStream({
    model: "gemini-3.8-flash",
    contents: userPrompt,
    config: {
      systemInstruction,
    },
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
