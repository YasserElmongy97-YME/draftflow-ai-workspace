import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { promptTemplates } from "@/db/schema";
import { updateTemplateSchema } from "@/lib/validation";

const uuidSchema = z.string().uuid();

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid template ID." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid update payload." },
        { status: 400 }
      );
    }

    const db = getDb();
    const [existing] = await db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }
    if (existing.isBuiltIn) {
      return NextResponse.json(
        { error: "Built-in templates cannot be modified." },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(promptTemplates)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(promptTemplates.id, id))
      .returning();

    return NextResponse.json({ template: updated });
  } catch (err) {
    console.error("PATCH /api/templates/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update template." },
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
      return NextResponse.json({ error: "Invalid template ID." }, { status: 400 });
    }

    const db = getDb();
    const [existing] = await db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }
    if (existing.isBuiltIn) {
      return NextResponse.json(
        { error: "Built-in templates cannot be deleted." },
        { status: 403 }
      );
    }

    await db.delete(promptTemplates).where(eq(promptTemplates.id, id));
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/templates/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete template." },
      { status: 500 }
    );
  }
}
