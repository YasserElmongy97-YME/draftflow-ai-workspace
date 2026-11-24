import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { articles, articleVersions } from "@/db/schema";
import { restoreVersionSchema } from "@/lib/validation";
import { computeMetrics } from "@/lib/metrics";

const uuidSchema = z.string().uuid();

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid article ID." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = restoreVersionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid restore request." },
        { status: 400 }
      );
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

    const [targetVersion] = await db
      .select()
      .from(articleVersions)
      .where(
        and(
          eq(articleVersions.id, parsed.data.versionId),
          eq(articleVersions.articleId, id)
        )
      )
      .limit(1);

    if (!targetVersion) {
      return NextResponse.json({ error: "Version not found." }, { status: 404 });
    }

    const nextVersionNumber = article.currentVersionNumber + 1;
    const metrics = computeMetrics(targetVersion.content);

    const [updated] = await db
      .update(articles)
      .set({
        title: targetVersion.title,
        currentContent: targetVersion.content,
        currentVersionNumber: nextVersionNumber,
        wordCount: metrics.wordCount,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();

    await db.insert(articleVersions).values({
      articleId: id,
      versionNumber: nextVersionNumber,
      title: targetVersion.title,
      content: targetVersion.content,
      changeLabel: `Restored from v${targetVersion.versionNumber}`,
      wordCount: metrics.wordCount,
    });

    const versions = await db
      .select()
      .from(articleVersions)
      .where(eq(articleVersions.articleId, id))
      .orderBy(desc(articleVersions.versionNumber));

    return NextResponse.json({ article: updated, versions });
  } catch (err) {
    console.error("POST /api/articles/[id]/restore error:", err);
    return NextResponse.json(
      { error: "Failed to restore version." },
      { status: 500 }
    );
  }
}
