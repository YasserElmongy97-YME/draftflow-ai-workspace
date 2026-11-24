import { NextRequest, NextResponse } from "next/server";
import { getAiRateLimiter, rateLimitHeaders } from "@/lib/rate-limit";
import { reviseRequestSchema } from "@/lib/validation";
import { buildRevisionPrompt } from "@/lib/prompt-builder";
import { streamReviseDraft } from "@/lib/ai";
import { isLiveAiEnabled } from "@/lib/env";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "local";
}

export async function POST(req: NextRequest) {
  const limiter = getAiRateLimiter();
  const limitResult = limiter.check(getClientIp(req));
  const rlHeaders = rateLimitHeaders(limitResult);

  if (!limitResult.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit reached. Try again in ${limitResult.retryAfterSeconds}s.`,
        retryAfterSeconds: limitResult.retryAfterSeconds,
      },
      { status: 429, headers: rlHeaders }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400, headers: rlHeaders }
    );
  }

  const parsed = reviseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid revision input." },
      { status: 400, headers: rlHeaders }
    );
  }

  const { systemInstruction, userPrompt, label } = buildRevisionPrompt(
    parsed.data.content,
    parsed.data.action,
    parsed.data.targetTone
  );
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamReviseDraft(
          systemInstruction,
          userPrompt,
          parsed.data.action,
          parsed.data.targetTone
        )) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        console.error("AI revision stream error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...rlHeaders,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Revision-Label": label,
      "X-AI-Mode": isLiveAiEnabled() ? "live" : "demo",
    },
  });
}
