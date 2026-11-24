import type { LengthOption, ToneOption } from "@/lib/validation";

export interface TemplateItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  systemInstruction: string;
  defaultTone: ToneOption;
  defaultLength: LengthOption;
  isBuiltIn: boolean;
}

export interface ArticleItem {
  id: string;
  title: string;
  templateId: string | null;
  templateName: string;
  tone: ToneOption;
  length: LengthOption;
  targetAudience: string;
  focusKeywords: string;
  currentContent: string;
  currentVersionNumber: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VersionItem {
  id: string;
  articleId: string;
  versionNumber: number;
  title: string;
  content: string;
  changeLabel: string;
  wordCount: number;
  createdAt: string;
}

export type ActiveView = "editor" | "templates" | "history";
