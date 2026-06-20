import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the editorial ambient shadow. */
  elevated?: boolean;
}

/** Surface container with the design system's rounded corners + hairline border. */
export function Card({ elevated = false, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant/40 bg-surface-container-lowest ${
        elevated ? "shadow-ambient" : ""
      } ${className}`}
      {...props}
    />
  );
}
