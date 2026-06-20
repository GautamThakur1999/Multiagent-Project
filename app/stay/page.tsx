"use client";

import Link from "next/link";
import { usePlan } from "@/components/PlanProvider";
import { StayLogistics } from "@/components/StayLogistics";
import { Container } from "@/components/Layout";
import { Icon } from "@/components/Icon";

export default function StayPage() {
  const { tripState } = usePlan();

  if (!tripState) {
    return (
      <main className="flex flex-grow items-center justify-center">
        <Container className="py-24 text-center">
          <Icon name="hotel" className="text-[48px] text-primary" />
          <h1 className="mt-4 text-headline-lg text-on-surface">No stay details yet</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Build a plan first, then come back for where to stay and how to get around.
          </p>
          <div className="mt-6">
            <Link href="/" className="text-primary underline">
              Plan a trip
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return <StayLogistics state={tripState} />;
}
