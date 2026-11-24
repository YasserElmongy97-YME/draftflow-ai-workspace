import { z } from "zod";

export const TONES = [
  "Direct",
  "Editorial",
  "Technical",
  "Conversational",
  "Executive",
  "Persuasive",
] as const;

export const LENGTHS = ["Short", "Medium", "Long"] as const;

export const REVISION_ACTIONS = [
  "tighten",
  "clarify",
  "expand",
  "fix_flow",
  "shift_tone",
] as const;

export type ToneOption = (typeof TONES)[number];
export type LengthOption = (typeof LENGTHS)[number];
export type RevisionAction = (typeof REVISION_ACTIONS)[number];

export const createTemplateSchema = z.object({
  name: z.string().trim().min(2, "Template name is required").max(80),
  description: z.string().trim().min(4, "Description is required").max(240),
  systemInstruction: z.string().trim().min(10, "Instruction must be at least 10 characters").max(2000),
  defaultTone: z.enum(TONES).default("Editorial"),
  defaultLength: z.enum(LENGTHS).default("Medium"),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const generateRequestSchema = z.object({
  topic: z.string().trim().min(3, "Enter a topic or brief (at least 3 characters)").max(1500),
  templateName: z.string().trim().min(1).max(80),
  templateInstruction: z.string().trim().min(1).max(2000),
  tone: z.enum(TONES),
  length: z.enum(LENGTHS),
  targetAudience: z.string().trim().max(200).optional().default(""),
  focusKeywords: z.string().trim().max(300).optional().default(""),
});

export const reviseRequestSchema = z.object({
  content: z.string().trim().min(10, "Draft content is too short to revise").max(30000),
  action: z.enum(REVISION_ACTIONS),
  targetTone: z.enum(TONES).optional(),
  selectionOnly: z.boolean().optional().default(false),
});

export const createArticleSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  templateId: z.string().uuid().nullable().optional(),
  templateName: z.string().trim().min(1).max(80),
  tone: z.enum(TONES),
  length: z.enum(LENGTHS),
  targetAudience: z.string().trim().max(200).optional().default(""),
  focusKeywords: z.string().trim().max(300).optional().default(""),
  content: z.string().trim().min(1, "Content cannot be empty"),
  changeLabel: z.string().trim().min(1).max(120).optional().default("Initial draft"),
});

export const updateArticleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1),
  changeLabel: z.string().trim().min(1).max(120).default("Manual save"),
  tone: z.enum(TONES).optional(),
  length: z.enum(LENGTHS).optional(),
});

export const restoreVersionSchema = z.object({
  versionId: z.string().uuid("Valid versionId is required"),
});
