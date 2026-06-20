"use client";

import type { TripState } from "@/lib/types";
import { Container } from "./Layout";
import { Icon } from "./Icon";

export interface RequestAdjustmentProps {
  state: TripState;
  /** Go edit the trip constraints (re-triggers planning). */
  onEditConstraints: () => void;
  /** Apply a suggested budget and re-plan. */
  onIncreaseBudget?: (amount: number) => void;
  /** Show the best-effort plan anyway. */
  onShowAnyway: () => void;
}

const CHECK_LABEL: Record<string, string> = {
  fits_duration: "Trip length",
  includes_all_cities: "Cities",
  within_budget: "Budget",
  matches_preferences: "Interests",
  avoids_crowds: "Crowds",
  travel_time_realistic: "Travel time",
};

export function RequestAdjustment({
  state,
  onEditConstraints,
  onIncreaseBudget,
  onShowAnyway,
}: RequestAdjustmentProps) {
  const { constraints, budget_breakdown: budget, review_result: review } = state;
  const failed = (review?.checks ?? []).filter((c) => c.status === "fail");
  const overBudget = budget && !budget.within_budget;
  const suggestedBudget = overBudget ? Math.ceil(budget.total_usd / 50) * 50 : null;
  const primary = failed[0];

  return (
    <main className="flex-grow">
      <Container className="py-stack-lg">
        <section className="mx-auto mb-stack-lg max-w-3xl text-center">
          <h1 className="mb-4 text-headline-xl text-on-surface">
            Let&apos;s refine your {constraints.destination} plan
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            {overBudget
              ? `A $${constraints.budget_usd.toLocaleString()} budget is tight for ${constraints.duration_days} days in ${constraints.destination}. We estimate about $${budget.total_usd.toLocaleString()} for this plan — here's how to make it work.`
              : "A few things didn't fully line up. Here's what to adjust so we can build the right plan."}
          </p>
        </section>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
          {/* Primary alert + failed checks */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-stack-lg shadow-ambient md:col-span-8">
            <div className="mb-stack-md flex items-start gap-4">
              <div className="rounded-full bg-secondary-container p-3 text-on-secondary-container">
                <Icon name="error" className="text-2xl" />
              </div>
              <div>
                <h2 className="text-headline-md text-on-surface">
                  {primary ? CHECK_LABEL[primary.check] ?? "Needs attention" : "Needs attention"} check
                </h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  {primary?.reason ?? "Some constraints couldn't all be satisfied at once."}
                </p>
              </div>
            </div>

            <h3 className="mb-4 mt-stack-lg text-label-md uppercase tracking-wider text-primary">
              What needs adjusting
            </h3>
            <div className="space-y-3">
              {failed.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-4 rounded-lg bg-surface-container-low p-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon name="chevron_right" className="text-primary" />
                    <span className="text-body-md text-on-surface">
                      {CHECK_LABEL[c.check] ?? c.check}
                    </span>
                  </div>
                  <span className="text-label-md text-on-surface-variant">
                    {c.suggested_fix ?? c.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-gutter md:col-span-4">
            <div className="rounded-xl bg-primary-container p-stack-md text-on-primary-container shadow-ambient">
              <h3 className="mb-2 text-headline-md">VoyageAI suggests</h3>
              <ul className="mb-stack-md space-y-4">
                {suggestedBudget && (
                  <li className="flex items-start gap-3">
                    <Icon name="payments" className="mt-0.5" />
                    <span className="text-body-md">
                      Raise your budget to about ${suggestedBudget.toLocaleString()} for this trip.
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <Icon name="tune" className="mt-0.5" />
                  <span className="text-body-md">
                    Or shorten the trip / trim cities to fit your current budget.
                  </span>
                </li>
                {budget?.cheaper_alternatives?.slice(0, 2).map((alt, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Icon name="savings" className="mt-0.5" />
                    <span className="text-body-md">{alt}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                {suggestedBudget && onIncreaseBudget && (
                  <button
                    type="button"
                    onClick={() => onIncreaseBudget(suggestedBudget)}
                    className="w-full rounded-lg bg-surface-container-lowest py-3 text-label-md font-bold text-primary shadow-sm transition-all hover:bg-surface-bright"
                  >
                    Raise budget to ${suggestedBudget.toLocaleString()} &amp; re-plan
                  </button>
                )}
                <button
                  type="button"
                  onClick={onEditConstraints}
                  className="w-full rounded-lg border border-on-primary-container/30 py-3 text-label-md font-bold text-on-primary-container transition-all hover:bg-on-primary-container/10"
                >
                  Edit my trip details
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onShowAnyway}
              className="w-full text-label-md text-on-surface-variant underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Show me the best-effort plan anyway
            </button>
          </div>
        </div>
      </Container>
    </main>
  );
}
