import { describe, it, expect } from "vitest";

/**
 * Sprint 1 smoke test — proves the Vitest harness runs.
 * Real domain/agent tests arrive in Sprint 2+.
 */
describe("test harness", () => {
  it("runs Vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
