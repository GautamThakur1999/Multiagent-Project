import { describe, it, expect } from "vitest";
import { formatNightlyRate, formatCostOrDash, isRateUnavailable } from "@/lib/format";

describe("formatNightlyRate", () => {
  it("renders a range for a normal stay", () => {
    expect(formatNightlyRate(80, 150)).toBe("$80–$150/night");
  });

  it("collapses an equal min/max to a single figure", () => {
    expect(formatNightlyRate(120, 120)).toBe("$120/night");
  });

  it("surfaces the degraded $0–$0 placeholder as unavailable, not 'free'", () => {
    expect(formatNightlyRate(0, 0)).toBe("Rate unavailable");
  });
});

describe("formatCostOrDash", () => {
  it("renders a dollar figure when present", () => {
    expect(formatCostOrDash(95)).toBe("$95");
  });

  it("renders an em dash for a missing/zero cost", () => {
    expect(formatCostOrDash(0)).toBe("—");
  });
});

describe("isRateUnavailable", () => {
  it("is true only for the $0–$0 placeholder", () => {
    expect(isRateUnavailable(0, 0)).toBe(true);
    expect(isRateUnavailable(80, 150)).toBe(false);
  });
});
