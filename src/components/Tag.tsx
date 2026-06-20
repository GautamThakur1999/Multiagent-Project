import type { Category } from "@/lib/types";
import { Icon } from "./Icon";

const CATEGORY_CLASSES: Record<Category, string> = {
  food: "bg-category-food/10 text-category-food",
  temple: "bg-category-temple/10 text-category-temple",
  experience: "bg-category-experience/10 text-category-experience",
  logistics: "bg-primary/10 text-primary",
};

export interface TagProps {
  label: string;
  category?: Category;
  onRemove?: () => void;
}

/** Category-colored tag (e.g. "Food", "Temples"). */
export function Tag({ label, category = "experience", onRemove }: TagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-label-sm uppercase tracking-wider ${CATEGORY_CLASSES[category]}`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className="-mr-1 rounded-full p-0.5 hover:bg-on-surface/10"
        >
          <Icon name="close" className="text-[14px]" />
        </button>
      )}
    </span>
  );
}
