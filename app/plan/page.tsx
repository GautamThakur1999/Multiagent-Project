"use client";

// Sprint 7 placeholder. The live progress + itinerary screens land in Sprint 8;
// this exists only to prove the confirmed constraints carry across navigation.
import Link from "next/link";
import { usePlan } from "@/components/PlanProvider";
import { Container } from "@/components/Layout";
import { Icon } from "@/components/Icon";

export default function PlanPage() {
  const { constraints } = usePlan();

  return (
    <main className="flex flex-grow items-center justify-center">
      <Container className="py-24 text-center">
        <Icon name="travel_explore" className="text-[48px] text-primary" />
        <h1 className="mt-4 text-headline-lg text-on-surface">Building your plan…</h1>
        {constraints ? (
          <p className="mt-2 text-body-md text-on-surface-variant">
            {constraints.duration_days} days in {constraints.destination} (
            {constraints.cities.join(", ")}) · ${constraints.budget_usd.toLocaleString()}
          </p>
        ) : (
          <p className="mt-2 text-body-md text-on-surface-variant">
            No trip yet.{" "}
            <Link href="/" className="text-primary underline">
              Start planning
            </Link>
            .
          </p>
        )}
        <p className="mt-6 text-label-sm uppercase tracking-wider text-outline">
          The live itinerary stream arrives in the next release.
        </p>
      </Container>
    </main>
  );
}
