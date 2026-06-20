"use client";

import type { LogisticsLeg, StayRecommendation, TripState } from "@/lib/types";
import { Container } from "./Layout";
import { Card } from "./Card";
import { Icon } from "./Icon";

function priceTier(stay: StayRecommendation): string {
  const avg = (stay.price_range_usd_per_night.min + stay.price_range_usd_per_night.max) / 2;
  const tier = avg < 100 ? 1 : avg < 200 ? 2 : avg < 350 ? 3 : 4;
  return "$".repeat(tier);
}

function bookUrl(leg: LogisticsLeg): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${leg.mode} ${leg.from} to ${leg.to} tickets`)}`;
}

function NeighborhoodCard({ stay }: { stay: StayRecommendation }) {
  return (
    <Card elevated className="overflow-hidden">
      {/* Photo placeholder (no external images) */}
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-primary-container/20 to-secondary-container/20">
        <Icon name="apartment" className="text-[44px] text-primary/40" />
        <span className="absolute right-4 top-4 rounded-full bg-surface/90 px-3 py-1 text-label-sm font-bold text-primary backdrop-blur">
          {priceTier(stay)}
        </span>
      </div>
      <div className="p-stack-md">
        <h4 className="mb-1 text-lg font-bold text-on-surface">{stay.neighborhood}</h4>
        <p className="mb-1 text-label-sm text-on-surface-variant">
          {stay.nights} night{stay.nights > 1 ? "s" : ""} · ${stay.price_range_usd_per_night.min}–$
          {stay.price_range_usd_per_night.max}/night
        </p>
        <p className="mb-4 text-body-md text-on-surface-variant">{stay.rationale}</p>
        {/* Map placeholder */}
        <div className="flex items-start gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-3">
          <Icon name="map" className="text-[20px] text-primary" />
          <div className="text-label-sm text-on-surface">
            {stay.neighborhood}, {stay.city}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TransitCard({ leg }: { leg: LogisticsLeg }) {
  const hours = Math.floor(leg.duration_minutes / 60);
  const mins = leg.duration_minutes % 60;
  return (
    <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl border border-primary/10 bg-surface-container p-stack-lg md:flex-row">
      <Icon name="train" className="pointer-events-none absolute right-4 top-2 text-[120px] text-primary/5" />
      <div className="z-10 flex-1 text-center md:text-left">
        <span className="mb-2 inline-block rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-on-primary">
          {leg.mode}
        </span>
        <h3 className="text-headline-md text-primary">
          {leg.from} → {leg.to}
        </h3>
        {leg.notes && <p className="mt-1 italic text-on-surface-variant">{leg.notes}</p>}
      </div>
      <div className="z-10 flex gap-12 text-center">
        <div>
          <div className="mb-1 text-label-sm uppercase text-on-surface-variant">Duration</div>
          <div className="text-lg font-bold text-on-surface">
            {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
          </div>
        </div>
        <div>
          <div className="mb-1 text-label-sm uppercase text-on-surface-variant">Est. Cost</div>
          <div className="text-lg font-bold text-secondary">${leg.est_cost_usd}</div>
        </div>
      </div>
      <a
        href={bookUrl(leg)}
        target="_blank"
        rel="noopener noreferrer"
        className="z-10 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-105"
      >
        Book
        <Icon name="open_in_new" className="text-[18px]" />
      </a>
    </div>
  );
}

export function StayLogistics({ state }: { state: TripState }) {
  const stays = state.stay_recommendations ?? [];
  const interCity = (state.logistics_legs ?? []).filter((l) => l.leg_type === "inter-city");

  // Group stays by city, preserving first-seen order.
  const byCity: { city: string; stays: StayRecommendation[] }[] = [];
  for (const stay of stays) {
    const group = byCity.find((g) => g.city === stay.city);
    if (group) group.stays.push(stay);
    else byCity.push({ city: stay.city, stays: [stay] });
  }

  return (
    <main className="flex-grow">
      <Container className="py-stack-lg">
        <header className="mb-stack-lg">
          <span className="text-label-sm uppercase tracking-widest text-secondary">
            Logistics &amp; Accommodation
          </span>
          <h1 className="mt-2 text-headline-xl text-on-surface">Where to Stay</h1>
        </header>

        <div className="space-y-stack-lg">
          {byCity.map((group, gi) => (
            <section key={group.city}>
              <div className="mb-stack-md flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                  <Icon name="location_city" />
                </div>
                <h2 className="text-headline-md text-on-surface">{group.city} Neighborhoods</h2>
              </div>
              <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
                {group.stays.map((stay, i) => (
                  <NeighborhoodCard key={`${group.city}-${i}`} stay={stay} />
                ))}
              </div>

              {/* Transit card after the first city block */}
              {gi === 0 &&
                interCity.map((leg, i) => (
                  <div key={`leg-${i}`} className="my-stack-lg">
                    <TransitCard leg={leg} />
                  </div>
                ))}
            </section>
          ))}

          {byCity.length === 0 && (
            <p className="text-body-md text-on-surface-variant">
              No accommodation details are available for this trip.
            </p>
          )}
        </div>
      </Container>
    </main>
  );
}
