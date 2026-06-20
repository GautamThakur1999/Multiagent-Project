import type { Category, ItineraryDay, ItineraryItem, TimeBlock } from "@/lib/types";
import { Tag } from "./Tag";
import { PriorityPill } from "./PriorityPill";
import { Icon } from "./Icon";

const TIME_LABEL: Record<TimeBlock, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const DOT: Record<TimeBlock, string> = {
  morning: "bg-primary",
  afternoon: "bg-primary-fixed-dim",
  evening: "bg-secondary-fixed",
};

const CATEGORY_LABEL: Record<Category, string> = {
  food: "Food",
  temple: "Temple",
  experience: "Experience",
  logistics: "Travel",
};

function cost(item: ItineraryItem): string {
  return item.est_cost_usd > 0 ? `Est. $${item.est_cost_usd.toLocaleString()}` : "Free";
}

function ItemRow({ item }: { item: ItineraryItem }) {
  return (
    <div className="relative">
      <div
        className={`absolute -left-[29px] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-surface-container-lowest ${DOT[item.time_block]}`}
      />
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
          {TIME_LABEL[item.time_block]}
        </span>
        <Tag label={CATEGORY_LABEL[item.category]} category={item.category} />
        <PriorityPill priority={item.priority} />
      </div>
      <h4 className="text-lg font-bold text-on-surface">{item.title}</h4>
      <p className="mb-1 text-body-md text-on-surface-variant">{item.description}</p>
      <div className="text-label-md text-primary">{cost(item)}</div>
      {item.tips && (
        <div className="mt-1 flex items-center gap-1 text-label-sm text-on-surface-variant">
          <Icon name="wb_sunny" className="text-[16px]" />
          {item.tips}
        </div>
      )}
    </div>
  );
}

export interface DayCardProps {
  day: ItineraryDay;
  onRegenerate?: (day: ItineraryDay) => void;
  onCheaper?: (day: ItineraryDay) => void;
}

export function DayCard({ day, onRegenerate, onCheaper }: DayCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-ambient">
      <div className="p-stack-md md:p-gutter">
        <div className="mb-6">
          <h3 className="mb-1 text-headline-md text-on-surface">
            Day {day.day} — {day.city}
            {day.theme ? `: ${day.theme}` : ""}
          </h3>
          {day.date_label && <p className="italic text-on-surface-variant">{day.date_label}</p>}
        </div>

        <div className="relative space-y-stack-md pl-8">
          <div className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-outline-variant/60" />
          {day.items.map((item, i) => (
            <ItemRow key={i} item={item} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4 border-t border-outline-variant pt-6">
          <button
            type="button"
            onClick={() => onRegenerate?.(day)}
            className="flex items-center gap-2 text-label-md font-semibold text-primary transition-all hover:underline"
          >
            <Icon name="auto_fix" className="text-[18px]" />
            Regenerate this day
          </button>
          <button
            type="button"
            onClick={() => onCheaper?.(day)}
            className="flex items-center gap-2 text-label-md font-semibold text-secondary transition-all hover:underline"
          >
            <Icon name="savings" className="text-[18px]" />
            Make it cheaper
          </button>
        </div>
      </div>
    </section>
  );
}
