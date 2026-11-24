import type { LengthOption, RevisionAction, ToneOption } from "./validation";

export interface GenerationPromptInput {
  topic: string;
  templateName: string;
  templateInstruction: string;
  tone: ToneOption;
  length: LengthOption;
  targetAudience?: string;
  focusKeywords?: string;
}

const LENGTH_GUIDANCE: Record<LengthOption, string> = {
  Short: "Target roughly 280 to 380 words. Keep every paragraph tight.",
  Medium: "Target roughly 650 to 800 words with 2 to 4 clear H2 sections.",
  Long: "Target roughly 1,100 to 1,400 words with thorough sections, concrete examples, and a grounded conclusion.",
};

const TONE_GUIDANCE: Record<ToneOption, string> = {
  Direct: "Use plain, crisp sentences. Lead with conclusions and cut filler.",
  Editorial: "Write with measured authority, clear structure, and nuanced perspective.",
  Technical: "Write for experienced engineers. Prioritize precision, trade-offs, and concrete mechanics.",
  Conversational: "Write naturally as one practitioner talking to another, without being sloppy.",
  Executive: "Focus on outcomes, operational risk, and decision-making clarity.",
  Persuasive: "Build a logical case backed by specific benefits and concrete evidence.",
};

export function buildGenerationPrompt(input: GenerationPromptInput): {
  systemInstruction: string;
  userPrompt: string;
} {
  const systemInstruction = [
    "You are an experienced human editor writing clean Markdown copy for a publishing team.",
    "Output valid Markdown starting with a single H1 title (# Title).",
    "Do not wrap the response in code fences. Do not include meta commentary or emojis.",
    "Avoid hollow marketing cliches (e.g., 'in today's fast-paced world', 'game-changer', 'revolutionize').",
    `Template guidance (${input.templateName}): ${input.templateInstruction}`,
    `Tone (${input.tone}): ${TONE_GUIDANCE[input.tone]}`,
    `Length (${input.length}): ${LENGTH_GUIDANCE[input.length]}`,
  ].join("\n");

  const userLines = [`Topic / Brief: ${input.topic.trim()}`];
  if (input.targetAudience?.trim()) {
    userLines.push(`Target Audience: ${input.targetAudience.trim()}`);
  }
  if (input.focusKeywords?.trim()) {
    userLines.push(`Focus Keywords (weave naturally): ${input.focusKeywords.trim()}`);
  }

  return {
    systemInstruction,
    userPrompt: userLines.join("\n"),
  };
}

export function buildRevisionPrompt(
  content: string,
  action: RevisionAction,
  targetTone?: ToneOption
): {
  systemInstruction: string;
  userPrompt: string;
  label: string;
} {
  const instructions: Record<RevisionAction, { directive: string; label: string }> = {
    tighten: {
      directive:
        "Tighten this text by roughly 25-30%. Cut repetition, filler phrases, and weak qualifiers while preserving every core fact and Markdown structure.",
      label: "Revision: Tighten",
    },
    clarify: {
      directive:
        "Improve clarity and precision. Untangle dense sentences, replace vague phrasing with concrete terms, and preserve Markdown formatting.",
      label: "Revision: Clarify",
    },
    expand: {
      directive:
        "Expand this text with deeper explanation, concrete examples, and practical detail while maintaining the existing voice and Markdown structure.",
      label: "Revision: Expand",
    },
    fix_flow: {
      directive:
        "Fix grammar, rhythm, and paragraph transitions so the piece reads smoothly from start to finish without changing its core meaning.",
      label: "Revision: Fix Flow",
    },
    shift_tone: {
      directive: `Rewrite this text in a ${targetTone ?? "Direct"} tone (${
        TONE_GUIDANCE[targetTone ?? "Direct"]
      }) while keeping the same core information and Markdown structure.`,
      label: `Revision: Tone (${targetTone ?? "Direct"})`,
    },
  };

  const chosen = instructions[action];
  const systemInstruction = [
    "You are a senior copy editor revising an existing Markdown draft.",
    chosen.directive,
    "Return only the revised Markdown. Do not add commentary before or after the draft. Do not use emojis.",
  ].join("\n");

  return {
    systemInstruction,
    userPrompt: content,
    label: chosen.label,
  };
}
