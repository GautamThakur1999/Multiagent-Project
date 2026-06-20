"use client";

import type { TripConstraints } from "@/lib/types";
import { Icon } from "./Icon";
import { EditableChips } from "./EditableChips";
import { Tag } from "./Tag";

function tagCategory(value: string): "food" | "temple" | "experience" {
  const s = value.toLowerCase();
  if (/food|eat|cuisine|restaurant|ramen|sushi/.test(s)) return "food";
  if (/temple|shrine|spiritual|religio/.test(s)) return "temple";
  return "experience";
}

export interface ConstraintSummaryProps {
  value: TripConstraints;
  onChange: (next: TripConstraints) => void;
}

/** Editable bento summary of the parsed trip constraints. */
export function ConstraintSummary({ value, onChange }: ConstraintSummaryProps) {
  const patch = (p: Partial<TripConstraints>) => onChange({ ...value, ...p });

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Destination & duration */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 md:col-span-2">
        <span className="text-label-sm uppercase text-outline">Destination &amp; Duration</span>
        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          <input
            aria-label="Destination"
            value={value.destination}
            onChange={(e) => patch({ destination: e.target.value })}
            className="w-44 border-b border-outline-variant bg-transparent text-headline-lg text-on-surface focus:border-primary focus:outline-none"
          />
          <label className="flex items-center gap-2 text-body-md text-on-surface-variant">
            <input
              aria-label="Duration in days"
              type="number"
              min={1}
              value={value.duration_days}
              onChange={(e) => patch({ duration_days: Math.max(1, Number(e.target.value) || 1) })}
              className="w-16 border-b border-outline-variant bg-transparent text-body-md focus:border-primary focus:outline-none"
            />
            days
          </label>
        </div>
      </div>

      {/* Budget */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6">
        <span className="text-label-sm uppercase text-outline">Budget</span>
        <div className="mt-4 flex items-center gap-1 text-headline-lg text-on-surface">
          <span>$</span>
          <input
            aria-label="Budget in USD"
            type="number"
            min={0}
            value={value.budget_usd}
            onChange={(e) => patch({ budget_usd: Math.max(0, Number(e.target.value) || 0) })}
            className="w-28 border-b border-outline-variant bg-transparent text-headline-lg focus:border-primary focus:outline-none"
          />
        </div>
        <div className="mt-1 text-label-md text-on-surface-variant">{value.currency}</div>
      </div>

      {/* Cities */}
      <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5">
        <EditableChips
          label="Cities"
          values={value.cities}
          placeholder="Add city"
          onChange={(cities) => patch({ cities })}
        />
      </div>

      {/* Loves / preferences */}
      <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5">
        <EditableChips
          label="Loves"
          values={value.preferences}
          placeholder="Add interest"
          onChange={(preferences) => patch({ preferences })}
          renderChip={(v, onRemove) => <Tag label={v} category={tagCategory(v)} onRemove={onRemove} />}
        />
      </div>

      {/* Avoids */}
      <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5">
        <EditableChips
          label="Avoids"
          values={value.avoidances}
          placeholder="Add avoidance"
          onChange={(avoidances) => patch({ avoidances })}
        />
      </div>

      {/* Party */}
      <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5">
        <span className="block text-label-sm uppercase text-outline">Party</span>
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-body-md text-on-surface-variant">
            <Icon name="person" className="text-[18px] text-primary" />
            Travelers:
            <input
              aria-label="Travelers"
              type="number"
              min={1}
              value={value.travelers}
              onChange={(e) => patch({ travelers: Math.max(1, Number(e.target.value) || 1) })}
              className="w-16 border-b border-outline-variant bg-transparent focus:border-primary focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-body-md text-on-surface-variant">
            <Icon name="speed" className="text-[18px] text-primary" />
            Pace:
            <select
              aria-label="Pace"
              value={value.pace}
              onChange={(e) => patch({ pace: e.target.value as TripConstraints["pace"] })}
              className="border-b border-outline-variant bg-transparent focus:border-primary focus:outline-none"
            >
              <option value="slow">slow</option>
              <option value="moderate">moderate</option>
              <option value="fast">fast</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
