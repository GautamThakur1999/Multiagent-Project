import type { Priority } from "@/lib/types";

const CLASSES: Record<Priority, string> = {
  "must-do": "bg-priority-must/10 text-priority-must",
  "nice-to-have": "bg-priority-nice/10 text-priority-nice",
};

const LABELS: Record<Priority, string> = {
  "must-do": "Must-do",
  "nice-to-have": "Nice-to-have",
};

/** Priority indicator pill — used on itinerary items (Sprint 8). */
export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-bold uppercase tracking-wide ${CLASSES[priority]}`}
    >
      {LABELS[priority]}
    </span>
  );
}
