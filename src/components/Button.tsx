import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

// primary = coral (secondary token), the main call-to-action.
// secondary = teal (primary token), the "build my plan" confirm action.
// ghost = text-only.
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-secondary text-on-secondary shadow-sm hover:brightness-110 active:scale-95",
  secondary:
    "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-95",
  ghost: "text-on-surface-variant hover:text-primary",
};

const SIZES: Record<ButtonSize, string> = {
  md: "px-6 py-2.5 text-label-md",
  lg: "px-8 py-4 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
