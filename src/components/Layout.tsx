import type { ReactNode } from "react";

/** Page container: 1280px max width with responsive horizontal margins. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-container px-margin-mobile md:px-margin-desktop ${className}`}>
      {children}
    </div>
  );
}
