import { NextResponse } from "next/server";
import { handleCheaper } from "@/lib/api/edit";
import { buildGeminiClient } from "@/lib/api/deps";
import { logRequestLatency } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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

  try {
    const { status, body: responseBody } = await handleCheaper(body, buildGeminiClient());
    logRequestLatency("/api/cheaper", Date.now() - started, status < 400);
    return NextResponse.json(responseBody, { status });
  } catch {
    logRequestLatency("/api/cheaper", Date.now() - started, false);
    return NextResponse.json(
      { error: "server_error", message: "The planner is unavailable right now." },
      { status: 500 }
    );
  }
}
