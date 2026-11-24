import { NextResponse } from "next/server";
import { isLiveAiEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    aiMode: isLiveAiEnabled() ? "live" : "demo",
  });
}
