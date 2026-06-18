import type { CrowdLevel, Priority } from "@/lib/types";

/**
 * Typed sample grounding data for the seed destination (Japan: Tokyo + Kyoto).
 * Fed into the Destination Research and Logistics agent prompts so recommendations
 * are grounded in real places, prices, and travel times rather than hallucinated.
 *
 * v1 is a hand-curated fixture; live web/maps/hotel APIs are a later enhancement
 * (PRD Phase 2). Keep values representative, not authoritative.
 */

export interface NeighborhoodInfo {
  name: string;
  city: string;
  vibe: string;
  good_for: string[];
  price_tier: "budget" | "mid" | "luxury";
  hotel_price_usd_per_night: { min: number; max: number };
  crowd_level: CrowdLevel;
  why_stay: string;
}

export interface AttractionInfo {
  name: string;
  city: string;
  category: "food" | "temple" | "experience";
  neighborhood: string;
  crowd_level: CrowdLevel;
  best_time: string;
  off_peak_tip?: string;
  est_cost_usd: number;
  popularity: Priority;
  notes: string;
}

export interface InterCityTransport {
  from: string;
  to: string;
  mode: string;
  duration_minutes: number;
  est_cost_usd: number;
  booking_required: boolean;
  notes: string;
}

export interface IntraCityEstimate {
  city: string;
  from: string;
  to: string;
  mode: string;
  duration_minutes: number;
}

export interface DestinationData {
  destination: string;
  cities: string[];
  neighborhoods: NeighborhoodInfo[];
  attractions: AttractionInfo[];
  inter_city: InterCityTransport[];
  intra_city: IntraCityEstimate[];
}

export const JAPAN_DATA: DestinationData = {
  destination: "Japan",
  cities: ["Tokyo", "Kyoto"],
  neighborhoods: [
    {
      name: "Yanaka",
      city: "Tokyo",
      vibe: "Quiet old-town with temples, artisan shops, and a retro shopping street.",
      good_for: ["temples", "food", "low-crowd", "walking"],
      price_tier: "budget",
      hotel_price_usd_per_night: { min: 80, max: 150 },
      crowd_level: "low",
      why_stay: "One of the few Tokyo districts that survived the war intact — calm, cheap, and authentic, yet 20 min from the center.",
    },
    {
      name: "Asakusa",
      city: "Tokyo",
      vibe: "Traditional district anchored by Senso-ji, with street food and riverside walks.",
      good_for: ["temples", "food", "culture"],
      price_tier: "mid",
      hotel_price_usd_per_night: { min: 110, max: 200 },
      crowd_level: "medium",
      why_stay: "Walkable to Senso-ji and cheaper than central Tokyo; busy by day but quiet at night.",
    },
    {
      name: "Shinjuku",
      city: "Tokyo",
      vibe: "Neon nightlife, department stores, and Tokyo's busiest transit hub.",
      good_for: ["nightlife", "shopping", "transit"],
      price_tier: "luxury",
      hotel_price_usd_per_night: { min: 220, max: 450 },
      crowd_level: "high",
      why_stay: "Maximum convenience and energy, but the priciest and most crowded base.",
    },
    {
      name: "Higashiyama",
      city: "Kyoto",
      vibe: "Preserved historic streets winding between Kyoto's most famous temples.",
      good_for: ["temples", "culture", "walking"],
      price_tier: "mid",
      hotel_price_usd_per_night: { min: 130, max: 260 },
      crowd_level: "high",
      why_stay: "Walk to Kiyomizu-dera and Gion on foot; gorgeous but busy midday.",
    },
    {
      name: "Ohara",
      city: "Kyoto",
      vibe: "Rural temple valley in the northern hills, terraced fields and moss gardens.",
      good_for: ["temples", "nature", "low-crowd"],
      price_tier: "budget",
      hotel_price_usd_per_night: { min: 90, max: 170 },
      crowd_level: "low",
      why_stay: "An hour from central Kyoto but blissfully quiet — ideal for crowd-averse travelers.",
    },
    {
      name: "Downtown Kyoto (Nakagyo)",
      city: "Kyoto",
      vibe: "Central grid with Nishiki Market, Pontocho dining, and easy transit.",
      good_for: ["food", "shopping", "transit"],
      price_tier: "mid",
      hotel_price_usd_per_night: { min: 120, max: 240 },
      crowd_level: "medium",
      why_stay: "Most central base for food and transport; well-connected to all districts.",
    },
  ],
  attractions: [
    // --- Tokyo ---
    {
      name: "Senso-ji Temple",
      city: "Tokyo",
      category: "temple",
      neighborhood: "Asakusa",
      crowd_level: "high",
      best_time: "Before 8am",
      off_peak_tip: "Arrive before 8am — the Nakamise approach is empty and the light is best.",
      est_cost_usd: 0,
      popularity: "must-do",
      notes: "Tokyo's oldest temple; free to enter.",
    },
    {
      name: "Nezu Shrine",
      city: "Tokyo",
      category: "temple",
      neighborhood: "Yanaka",
      crowd_level: "low",
      best_time: "Weekday mornings",
      est_cost_usd: 0,
      popularity: "nice-to-have",
      notes: "Serene shrine with a miniature torii tunnel and almost no tourists.",
    },
    {
      name: "Tsukiji Outer Market",
      city: "Tokyo",
      category: "food",
      neighborhood: "Tsukiji",
      crowd_level: "medium",
      best_time: "7–9am",
      off_peak_tip: "Go right at opening; stalls sell out and lines build by 10am.",
      est_cost_usd: 25,
      popularity: "must-do",
      notes: "Fresh sushi, tamagoyaki, and grilled seafood from dozens of stalls.",
    },
    {
      name: "Yanaka Ginza",
      city: "Tokyo",
      category: "food",
      neighborhood: "Yanaka",
      crowd_level: "low",
      best_time: "Late afternoon",
      est_cost_usd: 15,
      popularity: "nice-to-have",
      notes: "Old-fashioned shopping street with cheap street snacks and zero tour buses.",
    },
    {
      name: "Meiji Shrine",
      city: "Tokyo",
      category: "temple",
      neighborhood: "Harajuku",
      crowd_level: "medium",
      best_time: "Opening hour",
      est_cost_usd: 0,
      popularity: "must-do",
      notes: "Forested shrine that stays calm if you arrive early.",
    },
    {
      name: "teamLab Planets",
      city: "Tokyo",
      category: "experience",
      neighborhood: "Toyosu",
      crowd_level: "high",
      best_time: "First or last slot",
      off_peak_tip: "Book the earliest timed ticket online; midday slots are shoulder-to-shoulder.",
      est_cost_usd: 30,
      popularity: "nice-to-have",
      notes: "Immersive digital-art museum; timed entry, books out days ahead.",
    },
    // --- Kyoto ---
    {
      name: "Fushimi Inari Taisha",
      city: "Kyoto",
      category: "temple",
      neighborhood: "Fushimi",
      crowd_level: "high",
      best_time: "Before 8am or after 5pm",
      off_peak_tip: "The thousand torii gates are empty at dawn; by 10am it's a slow-moving line.",
      est_cost_usd: 0,
      popularity: "must-do",
      notes: "Iconic vermilion torii trail up the mountain; free, open 24h.",
    },
    {
      name: "Arashiyama Bamboo Grove",
      city: "Kyoto",
      category: "experience",
      neighborhood: "Arashiyama",
      crowd_level: "high",
      best_time: "Dawn",
      off_peak_tip: "Arrive before 8am — after 9am the path is packed and photos are impossible.",
      est_cost_usd: 0,
      popularity: "must-do",
      notes: "Famous bamboo path; combine with quiet Okochi-Sanso garden nearby.",
    },
    {
      name: "Sanzen-in Temple",
      city: "Kyoto",
      category: "temple",
      neighborhood: "Ohara",
      crowd_level: "low",
      best_time: "Any time",
      est_cost_usd: 6,
      popularity: "nice-to-have",
      notes: "Moss garden and Buddhist hall in rural Ohara — peaceful and rarely crowded.",
    },
    {
      name: "Nishiki Market",
      city: "Kyoto",
      category: "food",
      neighborhood: "Downtown Kyoto (Nakagyo)",
      crowd_level: "medium",
      best_time: "Late morning",
      off_peak_tip: "Weekday late mornings are calmer than weekend afternoons.",
      est_cost_usd: 20,
      popularity: "must-do",
      notes: "Covered market — 'Kyoto's kitchen' — for tofu, pickles, and street bites.",
    },
    {
      name: "Philosopher's Path",
      city: "Kyoto",
      category: "experience",
      neighborhood: "Higashiyama",
      crowd_level: "low",
      best_time: "Early morning",
      est_cost_usd: 0,
      popularity: "nice-to-have",
      notes: "Canal-side walk linking quiet temples; lovely and uncrowded outside cherry season.",
    },
  ],
  inter_city: [
    {
      from: "Tokyo",
      to: "Kyoto",
      mode: "Shinkansen (Nozomi)",
      duration_minutes: 135,
      est_cost_usd: 95,
      booking_required: false,
      notes: "~2h15m fastest service. Reserved seats recommended in peak season; runs every ~10 min.",
    },
    {
      from: "Kyoto",
      to: "Tokyo",
      mode: "Shinkansen (Nozomi)",
      duration_minutes: 135,
      est_cost_usd: 95,
      booking_required: false,
      notes: "~2h15m return service, same line.",
    },
  ],
  intra_city: [
    { city: "Tokyo", from: "Tokyo Station", to: "Asakusa", mode: "Metro", duration_minutes: 20 },
    { city: "Tokyo", from: "Asakusa", to: "Shibuya/Harajuku", mode: "Metro", duration_minutes: 35 },
    { city: "Tokyo", from: "Yanaka", to: "Tsukiji", mode: "Metro", duration_minutes: 30 },
    { city: "Kyoto", from: "Kyoto Station", to: "Higashiyama", mode: "Bus", duration_minutes: 20 },
    { city: "Kyoto", from: "Downtown Kyoto (Nakagyo)", to: "Arashiyama", mode: "Train", duration_minutes: 25 },
    { city: "Kyoto", from: "Kyoto Station", to: "Fushimi Inari", mode: "JR Nara Line", duration_minutes: 7 },
    { city: "Kyoto", from: "Downtown Kyoto (Nakagyo)", to: "Ohara", mode: "Bus", duration_minutes: 60 },
  ],
};

const REGISTRY: Record<string, DestinationData> = {
  japan: JAPAN_DATA,
};

/** Returns grounding data for a destination, or null if unsupported (Sprint 4: Japan only). */
export function getDestinationData(destination: string): DestinationData | null {
  return REGISTRY[destination.trim().toLowerCase()] ?? null;
}

function matchesCities(itemCity: string, cities: string[]): boolean {
  if (cities.length === 0) return true;
  return cities.some((c) => c.trim().toLowerCase() === itemCity.trim().toLowerCase());
}

/**
 * Renders grounding data as a compact text block for an agent prompt,
 * filtered to the requested cities.
 */
export function formatGroundingForPrompt(data: DestinationData, cities: string[]): string {
  const neighborhoods = data.neighborhoods
    .filter((n) => matchesCities(n.city, cities))
    .map(
      (n) =>
        `- [${n.city}] ${n.name} (${n.crowd_level} crowd, ${n.price_tier} $${n.hotel_price_usd_per_night.min}-${n.hotel_price_usd_per_night.max}/night) — ${n.why_stay} Good for: ${n.good_for.join(", ")}.`
    )
    .join("\n");

  const attractions = data.attractions
    .filter((a) => matchesCities(a.city, cities))
    .map(
      (a) =>
        `- [${a.city}/${a.category}] ${a.name} — ${a.popularity}, ${a.crowd_level} crowd; best ${a.best_time}; ~$${a.est_cost_usd}.` +
        (a.off_peak_tip ? ` Off-peak: ${a.off_peak_tip}` : "") +
        ` (${a.notes})`
    )
    .join("\n");

  const interCity = data.inter_city
    .filter((t) => matchesCities(t.from, cities) && matchesCities(t.to, cities))
    .map(
      (t) =>
        `- ${t.from} → ${t.to} via ${t.mode}: ${t.duration_minutes} min, ~$${t.est_cost_usd}. ${t.notes}`
    )
    .join("\n");

  const intraCity = data.intra_city
    .filter((t) => matchesCities(t.city, cities))
    .map((t) => `- [${t.city}] ${t.from} → ${t.to}: ~${t.duration_minutes} min by ${t.mode}.`)
    .join("\n");

  return `DESTINATION DATA — ${data.destination}

Neighborhoods:
${neighborhoods}

Attractions & food:
${attractions}

Inter-city transport:
${interCity}

Intra-city travel times:
${intraCity}`;
}
