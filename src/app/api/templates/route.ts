import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { promptTemplates } from "@/db/schema";
import { createTemplateSchema } from "@/lib/validation";

function toSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "template"}-${Date.now().toString(36)}`;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(promptTemplates)
      .orderBy(asc(promptTemplates.createdAt));
    return NextResponse.json({ templates: rows });
  } catch (err) {
    console.error("GET /api/templates error:", err);
    return NextResponse.json(
      { error: "Failed to load prompt templates." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid template payload." },
        { status: 400 }
      );
    }

    const db = getDb();
    const [created] = await db
      .insert(promptTemplates)
      .values({
        name: parsed.data.name,
        slug: toSlug(parsed.data.name),
        description: parsed.data.description,
        systemInstruction: parsed.data.systemInstruction,
        defaultTone: parsed.data.defaultTone,
        defaultLength: parsed.data.defaultLength,
        isBuiltIn: false,
      })
      .returning();

    return NextResponse.json({ template: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/templates error:", err);
    return NextResponse.json(
      { error: "Failed to create template." },
      { status: 500 }
    );
  }
}
