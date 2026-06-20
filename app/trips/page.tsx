"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listSavedTrips, deleteTrip, type SavedTrip } from "@/lib/savedTrips";
import { encodeTripState } from "@/lib/shareLink";
import { Container } from "@/components/Layout";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";

export default function TripsPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);

  // localStorage is client-only — load after mount.
  useEffect(() => setTrips(listSavedTrips()), []);

  const remove = (id: string) => {
    deleteTrip(id);
    setTrips(listSavedTrips());
  };

  return (
    <main className="flex-grow">
      <Container className="py-stack-lg">
        <header className="mb-stack-lg">
          <h1 className="text-headline-xl text-on-surface">My Trips</h1>
          <p className="text-body-md text-on-surface-variant">
            Saved on this device. Open one to view, share, or export it.
          </p>
        </header>

        {trips.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-stack-lg text-center">
            <Icon name="bookmark" className="text-[40px] text-primary/40" />
            <p className="mt-3 text-body-md text-on-surface-variant">
              No saved trips yet. Build a plan and hit{" "}
              <span className="font-semibold text-on-surface">Save</span>.
            </p>
            <div className="mt-4">
              <Link href="/" className="text-primary underline">
                Plan a trip
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Card elevated className="flex h-full flex-col p-stack-md">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-on-surface">{trip.title}</h2>
                    <button
                      type="button"
                      aria-label={`Delete ${trip.title}`}
                      onClick={() => remove(trip.id)}
                      className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
                    >
                      <Icon name="delete" className="text-[20px]" />
                    </button>
                  </div>
                  <p className="mb-4 text-label-sm text-on-surface-variant">
                    {trip.state.constraints.cities.join(" & ")} · saved{" "}
                    {new Date(trip.savedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-auto">
                    <Link
                      href={`/plan?shared=${encodeTripState(trip.state)}`}
                      className="inline-flex items-center gap-2 text-label-md font-semibold text-primary hover:underline"
                    >
                      View itinerary
                      <Icon name="arrow_forward" className="text-[18px]" />
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}
