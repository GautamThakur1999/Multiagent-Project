import type { BudgetBreakdown } from "@/lib/types";
import { Card } from "./Card";

const CATEGORIES: { key: keyof BudgetBreakdown; label: string; bar: string }[] = [
  { key: "stay_usd", label: "Accommodation", bar: "bg-primary" },
  { key: "transport_usd", label: "Transport", bar: "bg-secondary" },
  { key: "food_usd", label: "Food & Dining", bar: "bg-category-food" },
  { key: "activities_usd", label: "Activities", bar: "bg-category-experience" },
];

export function BudgetCard({ budget, target }: { budget: BudgetBreakdown; target: number }) {
  const pct = (value: number) => (target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0);

  return (
    <Card elevated className="p-stack-md">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-lg font-bold text-on-surface">Budget Breakdown</h4>
        <span className={`font-bold ${budget.within_budget ? "text-primary" : "text-error"}`}>
          ${budget.total_usd.toLocaleString()} / ${target.toLocaleString()}
        </span>
      </div>
      <div className="space-y-4">
        {CATEGORIES.map((c) => {
          const value = budget[c.key] as number;
          return (
            <div key={c.key} className="space-y-1">
              <div className="flex justify-between text-label-sm text-on-surface-variant">
                <span>{c.label}</span>
                <span>${value.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                <div className={`h-full ${c.bar}`} style={{ width: `${pct(value)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {!budget.within_budget && budget.overspend_usd ? (
        <p className="mt-4 text-label-sm text-error">
          ${budget.overspend_usd.toLocaleString()} over budget.
        </p>
      ) : null}
    </Card>
  );
}
