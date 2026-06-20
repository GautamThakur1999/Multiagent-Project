"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePlan } from "@/components/PlanProvider";
import { streamPlanRequest } from "@/lib/planClient";
import { decodeTripState } from "@/lib/shareLink";
import { PlanProgress } from "@/components/PlanProgress";
import { ItineraryView } from "@/components/ItineraryView";
import { RequestAdjustment } from "@/components/RequestAdjustment";
import { Container } from "@/components/Layout";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import type { ProgressEvent } from "@/lib/agents/pipeline";
import type { TripState } from "@/lib/types";

function PlanInner() {
  const { constraints, setConstraints } = usePlan();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedParam = searchParams.get("shared");
  const sharedState = useMemo(() => (sharedParam ? decodeTripState(sharedParam) : null), [sharedParam]);

  const started = useRef(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [result, setResult] = useState<TripState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnyway, setShowAnyway] = useState(false);

  useEffect(() => {
    if (sharedState || started.current || !constraints) return;
    started.current = true;
    void streamPlanRequest(constraints, {
      onProgress: (e) => setEvents((prev) => [...prev, e]),
      onItinerary: (s) => setResult(s),
      onError: (err) => setError(err.message),
    });
  }, [constraints, sharedState]);

  // A shared link renders the encoded itinerary directly (no streaming).
  if (sharedState) return <ItineraryView state={sharedState} />;

  if (!constraints) {
    return (
      <main className="flex flex-grow items-center justify-center">
        <Container className="py-24 text-center">
          <Icon name="travel_explore" className="text-[48px] text-primary" />
          <h1 className="mt-4 text-headline-lg text-on-surface">No trip to plan yet</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Start by describing the trip you&apos;d like.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-4 text-base font-semibold text-on-secondary"
            >
              Describe my trip
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-grow items-center justify-center">
        <Container className="py-24 text-center">
          <Icon name="error" className="text-[44px] text-error" />
          <h1 className="mt-3 text-headline-md text-on-surface">We couldn&apos;t build your plan</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => router.push("/confirm")}>
              Back to constraints
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")}>
              Start over
            </Button>
          </div>
        </Container>
      </main>
    );
  }

  if (result) {
    // Infeasible / failed review → adjustment screen (unless the user opts to see it anyway).
    if (result.review_result?.overall === "fail" && !showAnyway) {
      return (
        <RequestAdjustment
          state={result}
          onEditConstraints={() => router.push("/confirm")}
          onIncreaseBudget={(amount) => {
            started.current = false;
            setEvents([]);
            setResult(null);
            setError(null);
            setShowAnyway(false);
            setConstraints({ ...constraints, budget_usd: amount });
          }}
          onShowAnyway={() => setShowAnyway(true)}
        />
      );
    }
    return <ItineraryView state={result} />;
  }

  return <PlanProgress events={events} destination={constraints.destination} />;
}

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanInner />
    </Suspense>
  );
}
