import { NextResponse } from "next/server";
import { validatePlanBody, streamPlan, formatSSE } from "@/lib/api/plan";
import { buildGeminiClient, getDestinationCache } from "@/lib/api/deps";
import { logRequestLatency } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const started = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const validation = validatePlanBody(body);
  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  let client;
  try {
    client = buildGeminiClient();
  } catch {
    return NextResponse.json(
      { error: "server_error", message: "The planner is unavailable right now." },
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: Parameters<typeof formatSSE>[0]) => {
        controller.enqueue(encoder.encode(formatSSE(event)));
      };
      await streamPlan(validation.constraints, client, emit, {
        cache: getDestinationCache(),
      });
      controller.close();
      logRequestLatency("/api/plan", Date.now() - started, true);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
