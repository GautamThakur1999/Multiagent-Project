"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePlan } from "@/components/PlanProvider";
import { streamPlanRequest } from "@/lib/planClient";
import { PlanProgress } from "@/components/PlanProgress";
import { ItineraryView } from "@/components/ItineraryView";
import { Container } from "@/components/Layout";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import type { ProgressEvent } from "@/lib/agents/pipeline";
import type { TripState } from "@/lib/types";

export default function PlanPage() {
  const { constraints } = usePlan();
  const router = useRouter();
  const started = useRef(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [tripState, setTripState] = useState<TripState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Start the stream once, after constraints are available. The ref guard keeps
    // React 18 StrictMode (dev) from firing a second, duplicate plan request.
    if (started.current || !constraints) return;
    started.current = true;
    void streamPlanRequest(constraints, {
      onProgress: (e) => setEvents((prev) => [...prev, e]),
      onItinerary: (s) => setTripState(s),
      onError: (err) => setError(err.message),
    });
  }, [constraints]);

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
            <Link href="/">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-4 text-base font-semibold text-on-secondary">
                Describe my trip
              </span>
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

  if (tripState) {
    return <ItineraryView state={tripState} />;
  }

  return <PlanProgress events={events} destination={constraints.destination} />;
}
