import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, articleVersions } from "@/db/schema";
import { createArticleSchema } from "@/lib/validation";
import { computeMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const tone = searchParams.get("tone")?.trim();
    const templateName = searchParams.get("template")?.trim();

    const conditions = [];
    if (q) {
      conditions.push(
        or(
          ilike(articles.title, `%${q}%`),
          ilike(articles.currentContent, `%${q}%`)
        )
      );
    }
    if (tone && tone !== "All") {
      conditions.push(eq(articles.tone, tone));
    }
    if (templateName && templateName !== "All") {
      conditions.push(eq(articles.templateName, templateName));
    }

    const db = getDb();
    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(articles)
            .where(and(...conditions))
            .orderBy(desc(articles.updatedAt))
        : await db.select().from(articles).orderBy(desc(articles.updatedAt));

    return NextResponse.json({ articles: rows });
  } catch (err) {
    console.error("GET /api/articles error:", err);
    return NextResponse.json(
      { error: "Failed to load articles." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid article payload." },
        { status: 400 }
      );
    }

    const metrics = computeMetrics(parsed.data.content);
    const db = getDb();

    const [created] = await db
      .insert(articles)
      .values({
        title: parsed.data.title,
        templateId: parsed.data.templateId ?? null,
        templateName: parsed.data.templateName,
        tone: parsed.data.tone,
        length: parsed.data.length,
        targetAudience: parsed.data.targetAudience,
        focusKeywords: parsed.data.focusKeywords,
        currentContent: parsed.data.content,
        currentVersionNumber: 1,
        wordCount: metrics.wordCount,
      })
      .returning();

    const [v1] = await db
      .insert(articleVersions)
      .values({
        articleId: created.id,
        versionNumber: 1,
        title: created.title,
        content: created.currentContent,
        changeLabel: parsed.data.changeLabel,
        wordCount: metrics.wordCount,
      })
      .returning();

    return NextResponse.json(
      { article: created, versions: [v1] },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/articles error:", err);
    return NextResponse.json(
      { error: "Failed to save article." },
      { status: 500 }
    );
  }
}
