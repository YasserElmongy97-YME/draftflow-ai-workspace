import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { promptTemplates, articles, articleVersions } from "./schema";
import { computeMetrics } from "../lib/metrics";

const BUILT_IN_TEMPLATES = [
  {
    name: "Editorial Article",
    slug: "editorial-article",
    description: "Long-form opinion or analytical piece with a clear thesis, structured sections, and concrete takeaways.",
    systemInstruction:
      "Write a well-structured editorial article with a sharp opening hook, clear H2 section breaks, concrete examples, and a grounded conclusion. Avoid filler transitions.",
    defaultTone: "Editorial",
    defaultLength: "Medium",
    isBuiltIn: true,
  },
  {
    name: "Technical Deep Dive",
    slug: "technical-deep-dive",
    description: "Engineering walkthrough covering architecture trade-offs, failure modes, and implementation details.",
    systemInstruction:
      "Write a technical engineering article for senior developers. Include architecture trade-offs, edge cases, concise code or schema examples in fenced Markdown blocks, and operational lessons.",
    defaultTone: "Technical",
    defaultLength: "Long",
    isBuiltIn: true,
  },
  {
    name: "LinkedIn Post",
    slug: "linkedin-post",
    description: "Tight, scannable professional post with a direct opening line and concise takeaways.",
    systemInstruction:
      "Write a focused LinkedIn post. Lead with a concrete observation or result in the first line, keep paragraphs to 1-2 sentences, use short bullet points where helpful, and close with a genuine question.",
    defaultTone: "Direct",
    defaultLength: "Short",
    isBuiltIn: true,
  },
  {
    name: "Product Release Note",
    slug: "product-release-note",
    description: "Changelog and feature announcement detailing what changed, why it matters, and migration steps.",
    systemInstruction:
      "Write a crisp product release note. Organize into Summary, What Changed, Why It Matters, and Rollout / Migration Notes. Keep claims specific and verifiable.",
    defaultTone: "Direct",
    defaultLength: "Short",
    isBuiltIn: true,
  },
  {
    name: "Weekly Newsletter",
    slug: "weekly-newsletter",
    description: "Curated team or subscriber dispatch with a lead essay, three brief links, and a closing note.",
    systemInstruction:
      "Write a readable weekly newsletter issue. Include a concise lead note, 2-3 structured highlights with clear takeaways, and a brief sign-off.",
    defaultTone: "Conversational",
    defaultLength: "Medium",
    isBuiltIn: true,
  },
  {
    name: "Landing Page Copy",
    slug: "landing-page-copy",
    description: "Clear product positioning with headline, subhead, problem framing, and concrete capability blocks.",
    systemInstruction:
      "Write grounded landing page copy. Provide a headline, a one-sentence subhead, three specific capability sections, and a concise call to action. Avoid hype or vague superlatives.",
    defaultTone: "Persuasive",
    defaultLength: "Short",
    isBuiltIn: true,
  },
];

const SAMPLE_ARTICLES = [
  {
    title: "Zero-Downtime PostgreSQL Migrations in Production",
    templateSlug: "technical-deep-dive",
    tone: "Technical",
    length: "Medium",
    targetAudience: "Backend engineers",
    focusKeywords: "PostgreSQL, migrations, expand-contract, locks",
    versions: [
      {
        label: "Initial draft",
        content: `# Zero-Downtime PostgreSQL Migrations in Production

Schema changes are one of the fastest ways to take down a healthy service. A single \`ALTER TABLE\` that acquires an \`ACCESS EXCLUSIVE\` lock can stall every incoming query until the connection pool saturates.

## The Expand-and-Contract Pattern

Rather than renaming or dropping a column in place, split the change across three deployments:

1. **Expand**: Add the new column as nullable with no default rewrite.
2. **Backfill**: Copy data in bounded batches (5,000 rows per transaction) while dual-writing from application code.
3. **Contract**: Switch reads to the new column, stop writing the old column, and drop it in a later release.

## Guardrails Worth Automating

Set \`lock_timeout = '2s'\` at the start of every migration script. If a migration cannot acquire its lock within two seconds, it should fail fast rather than queue behind a long-running report query.`,
      },
      {
        label: "Revision: Expand",
        content: `# Zero-Downtime PostgreSQL Migrations in Production

Schema changes are one of the fastest ways to take down a healthy service. A single \`ALTER TABLE\` that acquires an \`ACCESS EXCLUSIVE\` lock can stall every incoming query until the connection pool saturates.

## The Expand-and-Contract Pattern

Rather than renaming or dropping a column in place, split the change across three deployments:

1. **Expand**: Add the new column as nullable. In PostgreSQL 11+, adding a column with a constant default is metadata-only, but volatile defaults still trigger a full table rewrite.
2. **Backfill**: Copy data in bounded batches (5,000 rows per transaction) with a brief sleep between batches to avoid replication lag and autovacuum pressure.
3. **Contract**: Switch reads to the new column, remove writes to the old column, and drop it in a follow-up release once rollback risk has passed.

## Guardrails Worth Automating

Always set \`lock_timeout = '2s'\` and \`statement_timeout = '10s'\` at the top of every migration. If a migration cannot acquire its lock within two seconds, it should abort cleanly rather than block production traffic.

\`\`\`sql
SET lock_timeout = '2s';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status
  ON orders (status)
  WHERE archived_at IS NULL;
\`\`\`

Pair this with \`CREATE INDEX CONCURRENTLY\` so index builds never block writes.`,
      },
    ],
  },
  {
    title: "DraftFlow 1.4: Immutable Version Snapshots and Markdown Export",
    templateSlug: "product-release-note",
    tone: "Direct",
    length: "Short",
    targetAudience: "Editorial and content teams",
    focusKeywords: "version history, export, release note",
    versions: [
      {
        label: "Initial draft",
        content: `# DraftFlow 1.4: Immutable Version Snapshots and Markdown Export

## Summary

Version 1.4 introduces append-only version history for every draft and one-click export to Markdown, HTML, and plain text.

## What Changed

- **Version Snapshots**: Every generation, inline revision, and manual save records a numbered snapshot (\`v1\`, \`v2\`, \`v3\`).
- **Safe Restore**: Restoring an earlier version creates a new snapshot rather than overwriting recent edits.
- **Structured Export**: Exported Markdown files now include YAML frontmatter with title, template, tone, and timestamp.

## Rollout Notes

No schema migration is required for existing workspaces. All new saves automatically create versioned entries.`,
      },
      {
        label: "Manual save",
        content: `# DraftFlow 1.4: Immutable Version Snapshots and Markdown Export

## Summary

Version 1.4 introduces append-only version history for every draft and one-click export to Markdown, HTML, and plain text.

## What Changed

- **Version Snapshots**: Every generation, inline revision, and manual save records a numbered snapshot (\`v1\`, \`v2\`, \`v3\`) with word count and timestamp.
- **Safe Restore**: Restoring an earlier version appends a new snapshot rather than overwriting recent edits.
- **Structured Export**: Exported Markdown files include YAML frontmatter with title, template, tone, and ISO date.

## Rollout Notes

Run \`npm run db:push\` before deploying if you are self-hosting. Existing drafts remain intact and begin versioning on their next save.`,
      },
    ],
  },
  {
    title: "Issue #42: Why Editorial Teams Need Version Control",
    templateSlug: "weekly-newsletter",
    tone: "Conversational",
    length: "Short",
    targetAudience: "Content leads and technical writers",
    focusKeywords: "editorial workflow, version control, writing",
    versions: [
      {
        label: "Initial draft",
        content: `# Issue #42: Why Editorial Teams Need Version Control

Most writing tools treat a draft like a whiteboard: the moment you rewrite a paragraph, the earlier version disappears. That works fine for quick notes, but it breaks down when a team is iterating on a launch post or technical guide.

## Three Things Worth Keeping This Week

- **Keep every revision cheap**: When saving a snapshot takes one click, writers experiment more freely.
- **Separate drafting from editing**: Generate a rough structure first, then run tight editorial passes for clarity and length.
- **Own your output format**: Plain Markdown with frontmatter outlives any single CMS.

Reply to this issue if your team has a workflow habit that saved a deadline recently.`,
      },
    ],
  },
];

async function seed() {
  const db = getDb();

  const templateMap = new Map<string, { id: string; name: string }>();

  for (const tpl of BUILT_IN_TEMPLATES) {
    const existing = await db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.slug, tpl.slug))
      .limit(1);

    if (existing.length > 0) {
      templateMap.set(tpl.slug, { id: existing[0].id, name: existing[0].name });
    } else {
      const [inserted] = await db
        .insert(promptTemplates)
        .values(tpl)
        .returning();
      templateMap.set(tpl.slug, { id: inserted.id, name: inserted.name });
    }
  }

  const existingArticles = await db.select({ id: articles.id }).from(articles).limit(1);
  if (existingArticles.length === 0) {
    for (const sample of SAMPLE_ARTICLES) {
      const tpl = templateMap.get(sample.templateSlug);
      const latest = sample.versions[sample.versions.length - 1];
      const latestMetrics = computeMetrics(latest.content);

      const [createdArticle] = await db
        .insert(articles)
        .values({
          title: sample.title,
          templateId: tpl?.id ?? null,
          templateName: tpl?.name ?? "Editorial Article",
          tone: sample.tone,
          length: sample.length,
          targetAudience: sample.targetAudience,
          focusKeywords: sample.focusKeywords,
          currentContent: latest.content,
          currentVersionNumber: sample.versions.length,
          wordCount: latestMetrics.wordCount,
        })
        .returning();

      for (let i = 0; i < sample.versions.length; i++) {
        const v = sample.versions[i];
        const m = computeMetrics(v.content);
        await db.insert(articleVersions).values({
          articleId: createdArticle.id,
          versionNumber: i + 1,
          title: sample.title,
          content: v.content,
          changeLabel: v.label,
          wordCount: m.wordCount,
        });
      }
    }
  }

  console.log("Seed completed: 6 templates and sample articles ready.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
