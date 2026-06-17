import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getEnv, _resetEnvCache } from "@/lib/env";

describe("getEnv", () => {
  const original = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    _resetEnvCache();
  });

  afterEach(() => {
    _resetEnvCache();
    process.env.GEMINI_API_KEY = original;
  });

  it("returns the env object when GEMINI_API_KEY is set", () => {
    process.env.GEMINI_API_KEY = "test-key-abc123";
    const env = getEnv();
    expect(env.GEMINI_API_KEY).toBe("test-key-abc123");
  });

  it("throws when GEMINI_API_KEY is missing", () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => getEnv()).toThrow(/GEMINI_API_KEY/);
  });

  it("throws when GEMINI_API_KEY is an empty string", () => {
    process.env.GEMINI_API_KEY = "";
    expect(() => getEnv()).toThrow(/GEMINI_API_KEY/);
  });

  it("caches the result on repeated calls", () => {
    process.env.GEMINI_API_KEY = "cached-key";
    const first = getEnv();
    // Change the env after first call — cache should return original
    process.env.GEMINI_API_KEY = "changed-key";
    const second = getEnv();
    expect(second).toBe(first); // same object reference
    expect(second.GEMINI_API_KEY).toBe("cached-key");
  });

  it("reflects new value after _resetEnvCache()", () => {
    process.env.GEMINI_API_KEY = "first-key";
    getEnv();
    _resetEnvCache();
    process.env.GEMINI_API_KEY = "second-key";
    expect(getEnv().GEMINI_API_KEY).toBe("second-key");
  });
});
