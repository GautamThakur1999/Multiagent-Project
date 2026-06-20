import type { ReactNode } from "react";
import { Icon } from "./Icon";

export type ChipVariant = "outline" | "soft";

const VARIANTS: Record<ChipVariant, string> = {
  // suggestion / example-prompt pill
  outline:
    "border border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:bg-primary-fixed hover:text-on-primary-fixed-variant",
  // value pill (e.g. a city)
  soft: "border border-primary/10 bg-primary/5 text-primary",
};

export interface ChipProps {
  children: ReactNode;
  variant?: ChipVariant;
  onClick?: () => void;
  /** When provided, renders a remove (×) affordance. */
  onRemove?: () => void;
  className?: string;
}

export function Chip({ children, variant = "soft", onClick, onRemove, className = "" }: ChipProps) {
  const base = `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-md transition-all ${VARIANTS[variant]} ${className}`;

  const content = (
    <>
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-1 rounded-full p-0.5 hover:bg-on-surface/10"
        >
          <Icon name="close" className="text-[16px]" />
        </button>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} cursor-pointer`}>
        {content}
      </button>
    );
  }
  return <span className={base}>{content}</span>;
}
