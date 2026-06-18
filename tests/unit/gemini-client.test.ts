import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { createGeminiClient, type LogEvent, type RawGenerateFn } from "@/lib/gemini/client";
import { createMockGeminiClient } from "@/lib/gemini/mock";

const SimpleSchema = z.object({ name: z.string(), value: z.number() });
type Simple = z.infer<typeof SimpleSchema>;

const VALID_PAYLOAD: Simple = { name: "test", value: 42 };

// Helper: build a RawGenerateFn that returns given text strings in order
function makeRawFn(responses: Array<string | Error>): RawGenerateFn {
  let i = 0;
  return async () => {
    const r = responses[i++];
    if (r instanceof Error) throw r;
    return { text: r, usage: { promptTokens: 10, candidateTokens: 5, totalTokens: 15 } };
  };
}

// ---------------------------------------------------------------------------
// createGeminiClient — success path
// ---------------------------------------------------------------------------

describe("createGeminiClient — success", () => {
  it("returns validated typed data on first attempt", async () => {
    const rawFn = makeRawFn([JSON.stringify(VALID_PAYLOAD)]);
    const client = createGeminiClient({ apiKey: "test" }, rawFn);
    const result = await client.generateStructured("prompt", SimpleSchema);
    expect(result).toEqual(VALID_PAYLOAD);
  });

  it("calls the log hook on success with correct fields", async () => {
    const logs: LogEvent[] = [];
    const rawFn = makeRawFn([JSON.stringify(VALID_PAYLOAD)]);
    const client = createGeminiClient({ apiKey: "test", onLog: (e) => logs.push(e) }, rawFn);
    await client.generateStructured("prompt", SimpleSchema);
    expect(logs).toHaveLength(1);
    expect(logs[0].success).toBe(true);
    expect(logs[0].attempt).toBe(0);
    expect(logs[0].usage?.promptTokens).toBe(10);
    expect(logs[0].usage?.totalTokens).toBe(15);
    expect(logs[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it("uses gemini-2.5-flash-lite model by default in log", async () => {
    const logs: LogEvent[] = [];
    const rawFn = makeRawFn([JSON.stringify(VALID_PAYLOAD)]);
    const client = createGeminiClient({ apiKey: "test", onLog: (e) => logs.push(e) }, rawFn);
    await client.generateStructured("prompt", SimpleSchema);
    expect(logs[0].model).toBe("gemini-2.5-flash-lite");
  });

  it("clears the timeout timer on success so no timer leaks", async () => {
    vi.useFakeTimers();
    try {
      const rawFn = makeRawFn([JSON.stringify(VALID_PAYLOAD)]);
      const client = createGeminiClient({ apiKey: "test", timeoutMs: 30_000 }, rawFn);
      const result = await client.generateStructured("prompt", SimpleSchema);
      expect(result).toEqual(VALID_PAYLOAD);
      // Before the fix this left a dangling 30s timer on every successful call.
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// createGeminiClient — retry on bad JSON
// ---------------------------------------------------------------------------

describe("createGeminiClient — retry on malformed JSON", () => {
  it("retries once and succeeds on second attempt", async () => {
    const rawFn = makeRawFn(["not valid json{{{", JSON.stringify(VALID_PAYLOAD)]);
    const logs: LogEvent[] = [];
    const client = createGeminiClient({ apiKey: "test", onLog: (e) => logs.push(e) }, rawFn);
    const result = await client.generateStructured("prompt", SimpleSchema);
    expect(result).toEqual(VALID_PAYLOAD);
    expect(logs).toHaveLength(2);
    expect(logs[0].success).toBe(false);
    expect(logs[0].errorType).toBe("json_parse");
    expect(logs[0].attempt).toBe(0);
    expect(logs[1].success).toBe(true);
    expect(logs[1].attempt).toBe(1);
  });

  it("retries on Zod validation failure", async () => {
    const badPayload = JSON.stringify({ name: "ok", value: "not-a-number" });
    const rawFn = makeRawFn([badPayload, JSON.stringify(VALID_PAYLOAD)]);
    const logs: LogEvent[] = [];
    const client = createGeminiClient({ apiKey: "test", onLog: (e) => logs.push(e) }, rawFn);
    const result = await client.generateStructured("prompt", SimpleSchema);
    expect(result).toEqual(VALID_PAYLOAD);
    expect(logs[0].errorType).toBe("zod_validation");
    expect(logs[1].success).toBe(true);
  });

  it("throws after maxRetries (default 2) exhausted with bad JSON", async () => {
    const rawFn = makeRawFn(["bad", "bad", "bad"]);
    const client = createGeminiClient({ apiKey: "test" }, rawFn);
    await expect(client.generateStructured("prompt", SimpleSchema)).rejects.toThrow(
      /failed after 2 retr/
    );
  });

  it("respects custom maxRetries", async () => {
    const rawFn = makeRawFn(["bad", "bad", JSON.stringify(VALID_PAYLOAD)]);
    // maxRetries=1 means 2 total attempts (0, 1) — third call never happens
    const client = createGeminiClient({ apiKey: "test", maxRetries: 1 }, rawFn);
    await expect(client.generateStructured("prompt", SimpleSchema)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// createGeminiClient — timeout
// ---------------------------------------------------------------------------

describe("createGeminiClient — timeout", () => {
  it("throws a timeout error and does not retry", async () => {
    const logs: LogEvent[] = [];
    const slowFn: RawGenerateFn = () =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini request timed out after 50ms")), 200)
      );
    const client = createGeminiClient(
      { apiKey: "test", timeoutMs: 50, onLog: (e) => logs.push(e) },
      slowFn
    );
    await expect(client.generateStructured("prompt", SimpleSchema)).rejects.toThrow(/timed out/);
    expect(logs).toHaveLength(1);
    expect(logs[0].errorType).toBe("timeout");
  });
});

// ---------------------------------------------------------------------------
// createGeminiClient — API error (no retry)
// ---------------------------------------------------------------------------

describe("createGeminiClient — API error", () => {
  it("throws immediately on API errors without retrying", async () => {
    const logs: LogEvent[] = [];
    const rawFn = makeRawFn([new Error("403 Forbidden")]);
    const client = createGeminiClient(
      { apiKey: "test", onLog: (e) => logs.push(e) },
      rawFn
    );
    await expect(client.generateStructured("prompt", SimpleSchema)).rejects.toThrow("403 Forbidden");
    // Only one log entry (attempt 0 — no retry)
    expect(logs).toHaveLength(1);
    expect(logs[0].errorType).toBe("api_error");
  });
});

// ---------------------------------------------------------------------------
// createMockGeminiClient
// ---------------------------------------------------------------------------

describe("createMockGeminiClient", () => {
  it("returns predefined typed data", async () => {
    const mock = createMockGeminiClient([VALID_PAYLOAD]);
    const result = await mock.generateStructured("any prompt", SimpleSchema);
    expect(result).toEqual(VALID_PAYLOAD);
  });

  it("throws when a response is an Error instance", async () => {
    const mock = createMockGeminiClient([new Error("Simulated failure")]);
    await expect(mock.generateStructured("prompt", SimpleSchema)).rejects.toThrow(
      "Simulated failure"
    );
  });

  it("serves responses in order across multiple calls", async () => {
    const mock = createMockGeminiClient([
      { name: "first", value: 1 },
      { name: "second", value: 2 },
    ]);
    const first = await mock.generateStructured("p", SimpleSchema);
    const second = await mock.generateStructured("p", SimpleSchema);
    expect(first.value).toBe(1);
    expect(second.value).toBe(2);
  });

  it("throws when responses are exhausted", async () => {
    const mock = createMockGeminiClient([VALID_PAYLOAD]);
    await mock.generateStructured("p", SimpleSchema);
    await expect(mock.generateStructured("p", SimpleSchema)).rejects.toThrow(/exhausted/);
  });

  it("validates data against the schema (rejects invalid data)", async () => {
    const mock = createMockGeminiClient([{ name: "ok", value: "not-a-number" }]);
    await expect(mock.generateStructured("p", SimpleSchema)).rejects.toThrow();
  });

  it("works with vi.fn() for call tracking", async () => {
    const spy = vi.fn((_prompt: string, _schema: z.ZodType<Simple>) =>
      Promise.resolve(VALID_PAYLOAD)
    );
    const mockClient = { generateStructured: spy };
    await mockClient.generateStructured("test prompt", SimpleSchema);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith("test prompt", SimpleSchema);
  });
});
