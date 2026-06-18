import { describe, it, expect } from "vitest";
import {
  JAPAN_DATA,
  getDestinationData,
  formatGroundingForPrompt,
} from "@/lib/data/japan";

describe("getDestinationData", () => {
  it("returns Japan data for 'Japan' (case-insensitive)", () => {
    expect(getDestinationData("Japan")).toBe(JAPAN_DATA);
    expect(getDestinationData("japan")).toBe(JAPAN_DATA);
    expect(getDestinationData("  JAPAN  ")).toBe(JAPAN_DATA);
  });

  it("returns null for unsupported destinations", () => {
    expect(getDestinationData("France")).toBeNull();
  });
});

describe("JAPAN_DATA content", () => {
  it("covers both Tokyo and Kyoto neighborhoods", () => {
    const cities = new Set(JAPAN_DATA.neighborhoods.map((n) => n.city));
    expect(cities.has("Tokyo")).toBe(true);
    expect(cities.has("Kyoto")).toBe(true);
  });

  it("includes attractions across temple, food, and experience categories", () => {
    const cats = new Set(JAPAN_DATA.attractions.map((a) => a.category));
    expect(cats.has("temple")).toBe(true);
    expect(cats.has("food")).toBe(true);
    expect(cats.has("experience")).toBe(true);
  });

  it("includes the ~2h15m Shinkansen leg between Tokyo and Kyoto", () => {
    const leg = JAPAN_DATA.inter_city.find(
      (t) => t.from === "Tokyo" && t.to === "Kyoto"
    );
    expect(leg).toBeDefined();
    expect(leg?.mode).toMatch(/shinkansen/i);
    expect(leg?.duration_minutes).toBe(135);
  });

  it("provides at least one low-crowd option per city for crowd-averse travelers", () => {
    const lowTokyo = JAPAN_DATA.attractions.filter(
      (a) => a.city === "Tokyo" && a.crowd_level === "low"
    );
    const lowKyoto = JAPAN_DATA.attractions.filter(
      (a) => a.city === "Kyoto" && a.crowd_level === "low"
    );
    expect(lowTokyo.length).toBeGreaterThan(0);
    expect(lowKyoto.length).toBeGreaterThan(0);
  });

  it("gives every high-crowd must-do an off-peak tip", () => {
    const unmitigated = JAPAN_DATA.attractions.filter(
      (a) => a.popularity === "must-do" && a.crowd_level === "high" && !a.off_peak_tip
    );
    expect(unmitigated).toEqual([]);
  });
});

describe("formatGroundingForPrompt", () => {
  it("includes data for the requested cities and the Shinkansen leg", () => {
    const text = formatGroundingForPrompt(JAPAN_DATA, ["Tokyo", "Kyoto"]);
    expect(text).toContain("Fushimi Inari Taisha");
    expect(text).toContain("Senso-ji");
    expect(text).toMatch(/Shinkansen/i);
    expect(text).toContain("135 min");
  });

  it("filters out neighborhoods from non-requested cities", () => {
    const kyotoOnly = formatGroundingForPrompt(JAPAN_DATA, ["Kyoto"]);
    expect(kyotoOnly).toContain("Ohara"); // Kyoto neighborhood
    expect(kyotoOnly).not.toContain("Yanaka"); // Tokyo-only neighborhood
  });
});
