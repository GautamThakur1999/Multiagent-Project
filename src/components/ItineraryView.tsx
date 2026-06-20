"use client";

import { useState } from "react";
import type { ItineraryDay, TripState } from "@/lib/types";
import { saveTrip } from "@/lib/savedTrips";
import { Container } from "./Layout";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { DayCard } from "./DayCard";
import { ComplianceCard } from "./ComplianceCard";
import { BudgetCard } from "./BudgetCard";
import { LogisticsCard } from "./LogisticsCard";

export function ItineraryView({ state }: { state: TripState }) {
  const { constraints } = state;
  const days = state.final_itinerary ?? [];
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const stub = (label: string) => setNotice(`${label} arrives in the next update.`);
  const onSave = () => {
    saveTrip(state);
    setSaved(true);
    setNotice("Saved to your trips on this device.");
  };
  const onRegenerate = (_day: ItineraryDay) => stub("Per-day regeneration");
  const onCheaper = (_day: ItineraryDay) => stub("“Make it cheaper”");

  return (
    <main className="flex-grow">
      <Container className="py-stack-lg">
        {/* Header */}
        <header className="mb-stack-lg flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-label-md text-primary">
              <Icon name="verified" filled className="text-[18px]" />
              {state.review_result?.overall === "pass" ? "Verified plan" : "Best-effort plan"}
            </div>
            <h1 className="text-headline-xl text-on-surface">Your {constraints.destination} Journey</h1>
            <p className="text-body-lg text-on-surface-variant">
              {constraints.duration_days} days · {constraints.cities.join(" & ")} · $
              {constraints.budget_usd.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => stub("Sharing")}>
              <Icon name="ios_share" className="text-[18px]" />
              Share
            </Button>
            <Button variant="ghost" onClick={() => stub("Export")}>
              <Icon name="download" className="text-[18px]" />
              Export
            </Button>
            <Button variant="secondary" onClick={onSave}>
              <Icon name={saved ? "check" : "bookmark"} className="text-[18px]" />
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </header>

        {notice && (
          <div
            role="status"
            className="mb-gutter flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-label-md text-on-surface"
          >
            <Icon name="info" filled className="text-[18px] text-primary" />
            {notice}
          </div>
        )}

        {state.has_caveats && state.caveats.length > 0 && (
          <div className="mb-gutter rounded-xl border border-tertiary/30 bg-tertiary/5 p-4">
            <div className="mb-1 flex items-center gap-2 font-semibold text-tertiary">
              <Icon name="info" filled className="text-[18px]" />
              Heads up
            </div>
            <ul className="list-disc pl-5 text-body-md text-on-surface-variant">
              {state.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Body: itinerary + sticky sidebar */}
        <div className="flex flex-col gap-gutter lg:flex-row">
          <div className="space-y-stack-lg lg:w-2/3">
            {days.map((day) => (
              <DayCard key={day.day} day={day} onRegenerate={onRegenerate} onCheaper={onCheaper} />
            ))}
          </div>
          <aside className="lg:w-1/3">
            <div className="space-y-gutter lg:sticky lg:top-24">
              {state.review_result && <ComplianceCard review={state.review_result} />}
              {state.budget_breakdown && (
                <BudgetCard budget={state.budget_breakdown} target={constraints.budget_usd} />
              )}
              <LogisticsCard
                stays={state.stay_recommendations ?? []}
                legs={state.logistics_legs ?? []}
              />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
