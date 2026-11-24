import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const promptTemplates = pgTable("prompt_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  systemInstruction: text("system_instruction").notNull(),
  defaultTone: text("default_tone").notNull().default("Editorial"),
  defaultLength: text("default_length").notNull().default("Medium"),
  isBuiltIn: boolean("is_built_in").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    templateId: uuid("template_id").references(() => promptTemplates.id, {
      onDelete: "set null",
    }),
    templateName: text("template_name").notNull(),
    tone: text("tone").notNull(),
    length: text("length").notNull(),
    targetAudience: text("target_audience").notNull().default(""),
    focusKeywords: text("focus_keywords").notNull().default(""),
    currentContent: text("current_content").notNull(),
    currentVersionNumber: integer("current_version_number").notNull().default(1),
    wordCount: integer("word_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("articles_updated_at_idx").on(table.updatedAt),
    index("articles_tone_idx").on(table.tone),
  ]
);

export const articleVersions = pgTable(
  "article_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    changeLabel: text("change_label").notNull(),
    wordCount: integer("word_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("article_versions_article_id_idx").on(table.articleId),
  ]
);

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type NewPromptTemplate = typeof promptTemplates.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type ArticleVersion = typeof articleVersions.$inferSelect;
