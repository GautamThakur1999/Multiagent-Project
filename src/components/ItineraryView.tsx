"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ItineraryDay, TripState } from "@/lib/types";
import { saveTrip } from "@/lib/savedTrips";
import { encodeTripState } from "@/lib/shareLink";
import { regenerateDayRequest, makeCheaperRequest } from "@/lib/planClient";
import { usePlan } from "./PlanProvider";
import { Container } from "./Layout";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { DayCard } from "./DayCard";
import { ComplianceCard } from "./ComplianceCard";
import { BudgetCard } from "./BudgetCard";
import { LogisticsCard } from "./LogisticsCard";

export function ItineraryView({ state: initial }: { state: TripState }) {
  const router = useRouter();
  const { setTripState } = usePlan();
  const [state, setState] = useState<TripState>(initial);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const { constraints } = state;
  const days = state.final_itinerary ?? [];

  // Keep the shared/stay-detail screens in sync with whatever is on screen.
  useEffect(() => {
    setTripState(state);
  }, [state, setTripState]);

  const onSave = () => {
    saveTrip(state);
    setSaved(true);
    setNotice("Saved to your trips on this device.");
  };

  const onShare = async () => {
    const url = `${window.location.origin}/plan?shared=${encodeTripState(state)}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Shareable link copied to your clipboard.");
    } catch {
      setNotice(`Your shareable link: ${url}`);
    }
  };

  const onExport = () => {
    setNotice("Opening your print / PDF view…");
    if (typeof window !== "undefined") window.print();
  };

  const onRegenerate = async (day: ItineraryDay) => {
    setBusy(true);
    setNotice(`Regenerating day ${day.day}…`);
    const res = await regenerateDayRequest(constraints, day.day);
    setBusy(false);
    if (res.ok) {
      setState((s) => ({
        ...s,
        final_itinerary: (s.final_itinerary ?? []).map((d) => (d.day === day.day ? res.data.day : d)),
      }));
      setNotice(`Day ${day.day} regenerated.`);
    } else {
      setNotice(res.error.message);
    }
  };

  const onCheaper = async () => {
    setBusy(true);
    setNotice("Finding a cheaper plan…");
    const res = await makeCheaperRequest(constraints);
    setBusy(false);
    if (res.ok) {
      setState(res.data.state);
      setNotice("Updated with a more budget-friendly plan.");
    } else {
      setNotice(res.error.message);
    }
  };

  return (
    <main className="flex-grow">
      <Container className="py-stack-lg">
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
            <Button variant="ghost" onClick={() => router.push("/stay")}>
              <Icon name="hotel" className="text-[18px]" />
              Stay &amp; logistics
            </Button>
            <Button variant="ghost" onClick={() => router.push("/confirm")}>
              <Icon name="edit" className="text-[18px]" />
              Edit
            </Button>
            <Button variant="ghost" onClick={onShare}>
              <Icon name="ios_share" className="text-[18px]" />
              Share
            </Button>
            <Button variant="ghost" onClick={onExport}>
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
            <Icon name={busy ? "progress_activity" : "info"} filled className={`text-[18px] text-primary ${busy ? "animate-spin" : ""}`} />
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

        <div className="flex flex-col gap-gutter lg:flex-row">
          <div className={`space-y-stack-lg lg:w-2/3 ${busy ? "pointer-events-none opacity-60" : ""}`}>
            {days.map((day) => (
              <DayCard key={day.day} day={day} onRegenerate={onRegenerate} onCheaper={() => onCheaper()} />
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
