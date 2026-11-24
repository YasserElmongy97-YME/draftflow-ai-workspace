import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { articles, articleVersions } from "@/db/schema";
import { updateArticleSchema } from "@/lib/validation";
import { computeMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

const uuidSchema = z.string().uuid();

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid article ID." }, { status: 400 });
    }

    const db = getDb();
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (!article) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    const versions = await db
      .select()
      .from(articleVersions)
      .where(eq(articleVersions.articleId, id))
      .orderBy(desc(articleVersions.versionNumber));

    return NextResponse.json({ article, versions });
  } catch (err) {
    console.error("GET /api/articles/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to load article." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid article ID." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid save payload." },
        { status: 400 }
      );
    }

    const db = getDb();
    const [existing] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    const nextVersionNumber = existing.currentVersionNumber + 1;
    const metrics = computeMetrics(parsed.data.content);

    const [updated] = await db
      .update(articles)
      .set({
        title: parsed.data.title,
        currentContent: parsed.data.content,
        currentVersionNumber: nextVersionNumber,
        wordCount: metrics.wordCount,
        tone: parsed.data.tone ?? existing.tone,
        length: parsed.data.length ?? existing.length,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();

    await db.insert(articleVersions).values({
      articleId: id,
      versionNumber: nextVersionNumber,
      title: parsed.data.title,
      content: parsed.data.content,
      changeLabel: parsed.data.changeLabel,
      wordCount: metrics.wordCount,
    });

    const versions = await db
      .select()
      .from(articleVersions)
      .where(eq(articleVersions.articleId, id))
      .orderBy(desc(articleVersions.versionNumber));

    return NextResponse.json({ article: updated, versions });
  } catch (err) {
    console.error("PATCH /api/articles/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to save new version." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid article ID." }, { status: 400 });
    }

    const db = getDb();
    await db.delete(articles).where(eq(articles.id, id));
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/articles/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete article." },
      { status: 500 }
    );
  }
}
