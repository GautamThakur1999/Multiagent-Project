import type { TripConstraints } from "@/lib/types";
import { Icon } from "./Icon";

export interface ClarificationPanelProps {
  clarifications: string[];
  partial?: Partial<TripConstraints>;
}

/** Shown when the orchestrator needs more info before it can plan. */
export function ClarificationPanel({ clarifications, partial }: ClarificationPanelProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon name="help" filled />
        </div>
        <h2 className="text-headline-md text-on-surface">A few details first</h2>
      </div>

      <p className="text-body-md text-on-surface-variant">
        To craft the right plan, could you tell us:
      </p>

      <ul className="space-y-3">
        {clarifications.map((q, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4"
          >
            <Icon name="arrow_forward" className="mt-0.5 text-[18px] text-secondary" />
            <span className="text-body-md text-on-surface">{q}</span>
          </li>
        ))}
      </ul>

      {partial?.destination && (
        <p className="text-label-md text-on-surface-variant">
          So far we have: <span className="font-semibold text-on-surface">{partial.destination}</span>
          {partial.cities && partial.cities.length > 0 ? ` (${partial.cities.join(", ")})` : ""}.
        </p>
      )}
    </div>
  );
}
