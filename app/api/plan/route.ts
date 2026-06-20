import { NextResponse } from "next/server";
import { validatePlanBody, streamPlan, formatSSE } from "@/lib/api/plan";
import { buildGeminiClient, getDestinationCache } from "@/lib/api/deps";
import { logRequestLatency } from "@/lib/logging";
import { createPlanMetrics, logPlanSummary, spotAuditPlan } from "@/lib/metrics";
import type { TripState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The multi-agent plan can take ~10–40s; allow headroom (Vercel Pro).
export const maxDuration = 60;

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

  const metrics = createPlanMetrics();
  let client;
  try {
    client = buildGeminiClient(metrics.onLog);
  } catch {
    return NextResponse.json(
      { error: "server_error", message: "The planner is unavailable right now." },
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const captured: { state: TripState | null } = { state: null };
      const emit = (event: Parameters<typeof formatSSE>[0]) => {
        if (event.event === "itinerary") captured.state = event.data;
        controller.enqueue(encoder.encode(formatSSE(event)));
      };
      await streamPlan(validation.constraints, client, emit, {
        cache: getDestinationCache(),
      });
      controller.close();
      const ms = Date.now() - started;
      logRequestLatency("/api/plan", ms, true);
      logPlanSummary("/api/plan", metrics, ms, captured.state?.replan_count ?? 0);
      if (captured.state) spotAuditPlan(captured.state);
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
