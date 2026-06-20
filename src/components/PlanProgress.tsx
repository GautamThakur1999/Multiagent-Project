"use client";

import type { PipelineStage, ProgressEvent } from "@/lib/agents/pipeline";
import { Container } from "./Layout";
import { Icon } from "./Icon";

type StageStatus = "idle" | "active" | "done";

const SPECIALISTS: { stage: PipelineStage; label: string; icon: string; blurb: string }[] = [
  { stage: "destination", label: "Destination Research", icon: "travel_explore", blurb: "Finding food spots, temples, and quiet corners." },
  { stage: "logistics", label: "Logistics", icon: "train", blurb: "Mapping where to stay and how to move between cities." },
  { stage: "budget", label: "Budget", icon: "payments", blurb: "Balancing the plan against your budget." },
  { stage: "review", label: "Review", icon: "verified", blurb: "Checking duration, budget, preferences, and crowds." },
];

/** Latest status for a stage (handles a stage re-firing on a re-plan). */
function statusFor(events: ProgressEvent[], stage: PipelineStage): StageStatus {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].stage === stage) return events[i].status === "done" ? "done" : "active";
  }
  return "idle";
}

function StatusIndicator({ status }: { status: StageStatus }) {
  if (status === "done") {
    return <Icon name="check_circle" filled className="text-[22px] text-primary" />;
  }
  if (status === "active") {
    return (
      <span
        aria-label="in progress"
        className="block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
    );
  }
  return <span className="block h-5 w-5 rounded-full border-2 border-outline-variant" />;
}

export function PlanProgress({
  events,
  destination,
}: {
  events: ProgressEvent[];
  destination: string;
}) {
  const orchestrator = statusFor(events, "orchestrator");
  const activeLabel =
    SPECIALISTS.find((s) => statusFor(events, s.stage) === "active")?.label ??
    (orchestrator === "done" ? "Finalizing your itinerary" : "Coordinating the agents");

  return (
    <main className="flex flex-grow flex-col">
      <Container className="py-stack-lg">
        {/* Orchestrator node */}
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="relative rounded-full border border-primary/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary text-on-primary">
              <Icon name="cognition" className="text-4xl" />
            </div>
            {orchestrator !== "done" && (
              <span className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-primary/30" />
            )}
          </div>
          <h1 className="mt-stack-md text-headline-lg text-on-surface">
            Planning your {destination} trip
          </h1>
          <p
            data-testid="progress-status"
            className="mt-2 min-h-[28px] text-body-lg italic text-on-surface-variant"
          >
            {orchestrator === "done" ? "Done — opening your journey…" : `${activeLabel}…`}
          </p>
        </div>

        {/* Specialist + review cards */}
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {SPECIALISTS.map((s) => {
            const status = statusFor(events, s.stage);
            return (
              <div
                key={s.stage}
                data-testid={`agent-${s.stage}`}
                data-status={status}
                className={`flex flex-col items-start rounded-2xl border bg-surface-container-lowest p-6 transition-all duration-500 ${
                  status === "idle"
                    ? "border-outline-variant opacity-60"
                    : "border-primary/20 shadow-ambient"
                }`}
              >
                <div className="mb-4 flex w-full items-center justify-between">
                  <div
                    className={`rounded-lg p-3 ${
                      status === "idle"
                        ? "bg-surface-container text-on-surface-variant"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon name={s.icon} />
                  </div>
                  <StatusIndicator status={status} />
                </div>
                <h3 className="mb-2 text-label-md font-bold text-on-surface">{s.label}</h3>
                <p className="text-label-md leading-relaxed text-on-surface-variant">{s.blurb}</p>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: status === "done" ? "100%" : status === "active" ? "65%" : "0%" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
