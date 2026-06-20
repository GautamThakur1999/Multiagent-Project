"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePlan } from "@/components/PlanProvider";
import { parseRequest } from "@/lib/planClient";
import { ConstraintSummary } from "@/components/ConstraintSummary";
import { ClarificationPanel } from "@/components/ClarificationPanel";
import { Container } from "@/components/Layout";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { TripConstraintsSchema, type TripConstraints } from "@/lib/types";
import type { ExtractionResult } from "@/lib/agents/orchestrator";

type View =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "complete" }
  | { kind: "clarify"; clarifications: string[]; partial: Partial<TripConstraints> };

export default function ConfirmPage() {
  const { request, setConstraints } = usePlan();
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: "loading" });
  const [edited, setEdited] = useState<TripConstraints | null>(null);

  useEffect(() => {
    if (!request) {
      setView({ kind: "empty" });
      return;
    }
    const controller = new AbortController();
    setView({ kind: "loading" });
    parseRequest(request, controller.signal).then((outcome) => {
      if (controller.signal.aborted) return;
      if (!outcome.ok) {
        setView({ kind: "error", message: outcome.error.message });
        return;
      }
      applyResult(outcome.result);
    });
    return () => controller.abort();
  }, [request]);

  function applyResult(result: ExtractionResult) {
    if (result.status === "complete") {
      setEdited(result.constraints);
      setView({ kind: "complete" });
    } else {
      setView({ kind: "clarify", clarifications: result.clarifications_needed, partial: result.partial });
    }
  }

  function buildPlan() {
    if (!edited) return;
    const parsed = TripConstraintsSchema.safeParse(edited);
    if (!parsed.success) {
      setView({ kind: "error", message: "Some details look incomplete — please review and try again." });
      return;
    }
    setConstraints(parsed.data);
    router.push("/plan");
  }

  return (
    <main className="relative flex flex-grow items-center justify-center overflow-hidden py-stack-lg">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

      <Container className="z-10 max-w-4xl">
        {view.kind === "empty" ? (
          <EmptyState />
        ) : (
          <>
            <header className="mb-stack-lg text-center">
              <span className="mb-2 block text-label-sm uppercase tracking-widest text-primary-container">
                Refining your experience
              </span>
              <h1 className="mb-4 text-headline-xl text-on-surface">Almost there.</h1>
              <p className="mx-auto max-w-xl text-body-lg text-on-surface-variant">
                We synthesized your request into a structured foundation. Review and adjust before we
                build the full itinerary.
              </p>
            </header>

            <div className="rounded-3xl border border-outline-variant/50 bg-surface-container-lowest/70 p-6 shadow-ambient backdrop-blur md:p-10">
              {view.kind === "loading" && <LoadingState />}

              {view.kind === "error" && <ErrorState message={view.message} />}

              {view.kind === "clarify" && (
                <>
                  <ClarificationPanel clarifications={view.clarifications} partial={view.partial} />
                  <div className="mt-8 flex justify-center">
                    <Link href="/">
                      <Button variant="secondary" size="lg">
                        Refine my request
                        <Icon name="edit" />
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {view.kind === "complete" && edited && (
                <>
                  <div className="mb-stack-lg flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="auto_awesome" filled />
                    </div>
                    <h2 className="text-headline-md text-on-surface">
                      Got it — here&apos;s what I understood
                    </h2>
                  </div>

                  <ConstraintSummary value={edited} onChange={setEdited} />

                  <div className="mt-12 flex flex-col items-center gap-4">
                    <Button variant="secondary" size="lg" onClick={buildPlan}>
                      Looks right — build my plan
                      <Icon name="arrow_forward" />
                    </Button>
                    <Link
                      href="/"
                      className="text-label-md text-on-surface-variant transition-colors hover:text-primary"
                    >
                      I need to start over
                    </Link>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </Container>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="py-24 text-center">
      <Icon name="travel_explore" className="text-[48px] text-primary" />
      <h1 className="mt-4 text-headline-lg">Start by describing your trip</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">
        Tell us where you want to go and what you love.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button variant="primary" size="lg">
            Describe my trip
          </Button>
        </Link>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
      <Icon name="progress_activity" className="animate-spin text-[28px] text-primary" />
      <span className="text-body-md">Reading your request…</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <Icon name="error" className="text-[40px] text-error" />
      <p className="mt-3 text-body-md text-on-surface">{message}</p>
      <div className="mt-6">
        <Link href="/">
          <Button variant="primary">Try again</Button>
        </Link>
      </div>
    </div>
  );
}
