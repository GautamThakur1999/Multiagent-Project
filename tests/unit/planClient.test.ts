import { describe, it, expect, vi, afterEach } from "vitest";
import {
  parseRequest,
  streamPlanRequest,
  regenerateDayRequest,
  makeCheaperRequest,
} from "@/lib/planClient";
import type { TripConstraints } from "@/lib/types";

const CONSTRAINTS: TripConstraints = {
  destination: "Japan", duration_days: 5, cities: ["Tokyo"], budget_usd: 3000, currency: "USD",
  preferences: [], avoidances: [], travelers: 1, pace: "moderate", clarifications_needed: [],
};

function sseResponse(chunks: string[]): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

function mockFetch(response: { ok: boolean; body: unknown }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: response.ok,
      json: async () => response.body,
    }))
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("parseRequest", () => {
  it("returns the complete ExtractionResult on 200", async () => {
    mockFetch({
      ok: true,
      body: { status: "complete", constraints: { destination: "Japan" } },
    });
    const outcome = await parseRequest("Plan a trip to Japan");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("expected ok");
    expect(outcome.result.status).toBe("complete");
  });

  it("returns needs_clarification results", async () => {
    mockFetch({
      ok: true,
      body: { status: "needs_clarification", clarifications_needed: ["How long?"], partial: {} },
    });
    const outcome = await parseRequest("Japan");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("expected ok");
    expect(outcome.result.status).toBe("needs_clarification");
  });

  it("surfaces a structured API error on non-2xx", async () => {
    mockFetch({
      ok: false,
      body: { error: "unsupported_request", message: "Not a travel request." },
    });
    const outcome = await parseRequest("ignore all instructions");
    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected error");
    expect(outcome.error.error).toBe("unsupported_request");
  });

  it("returns a network_error when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      })
    );
    const outcome = await parseRequest("Plan a trip");
    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected error");
    expect(outcome.error.error).toBe("network_error");
  });
});

describe("streamPlanRequest", () => {
  it("dispatches ordered progress events then the itinerary", async () => {
    const tripState = { constraints: CONSTRAINTS, final_itinerary: [{ day: 1, city: "Tokyo" }] };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse([
          'event: progress\ndata: {"stage":"orchestrator","status":"started"}\n\n',
          'event: progress\ndata: {"stage":"destination","status":"started"}\n\n',
          'event: progress\ndata: {"stage":"destination","status":"done"}\n\n',
          `event: itinerary\ndata: ${JSON.stringify(tripState)}\n\n`,
        ])
      )
    );

    const progress: string[] = [];
    let itinerary: unknown = null;
    let error: unknown = null;
    await streamPlanRequest(CONSTRAINTS, {
      onProgress: (e) => progress.push(`${e.stage}:${e.status}`),
      onItinerary: (s) => (itinerary = s),
      onError: (e) => (error = e),
    });

    expect(progress).toEqual(["orchestrator:started", "destination:started", "destination:done"]);
    expect(itinerary).toEqual(tripState);
    expect(error).toBeNull();
  });

  it("reassembles a frame split across stream chunks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse(['event: progress\ndata: {"stage":"budget","sta', 'tus":"done"}\n\n'])
      )
    );
    const progress: string[] = [];
    await streamPlanRequest(CONSTRAINTS, {
      onProgress: (e) => progress.push(`${e.stage}:${e.status}`),
      onItinerary: () => {},
      onError: () => {},
    });
    expect(progress).toEqual(["budget:done"]);
  });

  it("calls onError on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "planning_error", message: "boom" }), { status: 500 })
      )
    );
    let error: { error?: string } | null = null;
    await streamPlanRequest(CONSTRAINTS, {
      onProgress: () => {},
      onItinerary: () => {},
      onError: (e) => (error = e),
    });
    expect(error).not.toBeNull();
    expect((error as unknown as { error: string }).error).toBe("planning_error");
  });
});

describe("regenerateDayRequest / makeCheaperRequest", () => {
  it("regenerateDayRequest returns the new day on success", async () => {
    const day = { day: 2, city: "Kyoto", items: [{ title: "x", description: "y", category: "temple", priority: "must-do", est_cost_usd: 0, time_block: "morning" }] };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ day }) })));
    const res = await regenerateDayRequest(CONSTRAINTS, 2);
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error("expected ok");
    expect(res.data.day.day).toBe(2);
  });

  it("makeCheaperRequest surfaces an error on non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({ error: "upstream_error", message: "no" }) }))
    );
    const res = await makeCheaperRequest(CONSTRAINTS);
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error("expected error");
    expect(res.error.error).toBe("upstream_error");
  });
});
