import { NextResponse } from "next/server";
import { handleParse } from "@/lib/api/parse";
import { buildGeminiClient } from "@/lib/api/deps";
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

  try {
    const client = buildGeminiClient();
    const { status, body: responseBody } = await handleParse(body, client);
    logRequestLatency("/api/parse", Date.now() - started, status < 400);
    return NextResponse.json(responseBody, { status });
  } catch (err) {
    logRequestLatency("/api/parse", Date.now() - started, false);
    // Most likely a missing GEMINI_API_KEY — don't leak details.
    return NextResponse.json(
      { error: "server_error", message: "The planner is unavailable right now." },
      { status: 500 }
    );
  }
}
