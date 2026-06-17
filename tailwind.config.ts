import type { Config } from "tailwindcss";

/**
 * Design tokens are ported verbatim from
 * `stitch_responsive_web_interface/modern_editorial_voyager/DESIGN.md`
 * (the "Modern Editorial Voyager" system). Keep this file in sync with that doc.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#faf9f7",
        "surface-dim": "#dadad8",
        "surface-bright": "#faf9f7",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f4f3f1",
        "surface-container": "#efeeec",
        "surface-container-high": "#e9e8e6",
        "surface-container-highest": "#e3e2e0",
        "on-surface": "#1a1c1b",
        "on-surface-variant": "#3e4948",
        "inverse-surface": "#2f3130",
        "inverse-on-surface": "#f1f1ef",
        outline: "#6e7979",
        "outline-variant": "#bdc9c8",
        "surface-tint": "#006a69",
        primary: "#006161",
        "on-primary": "#ffffff",
        "primary-container": "#0e7c7b",
        "on-primary-container": "#c3fffd",
        "inverse-primary": "#7cd5d3",
        secondary: "#a43c12",
        "on-secondary": "#ffffff",
        "secondary-container": "#fe7e4f",
        "on-secondary-container": "#6b1f00",
        tertiary: "#854524",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#a35d39",
        "on-tertiary-container": "#fff1eb",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#98f2f0",
        "primary-fixed-dim": "#7cd5d3",
        "on-primary-fixed": "#002020",
        "on-primary-fixed-variant": "#00504f",
        "secondary-fixed": "#ffdbcf",
        "secondary-fixed-dim": "#ffb59c",
        "on-secondary-fixed": "#380c00",
        "on-secondary-fixed-variant": "#822800",
        "tertiary-fixed": "#ffdbcc",
        "tertiary-fixed-dim": "#ffb693",
        "on-tertiary-fixed": "#351000",
        "on-tertiary-fixed-variant": "#713615",
        background: "#faf9f7",
        "on-background": "#1a1c1b",
        "surface-variant": "#e3e2e0",
        "category-food": "#2D6A4F",
        "category-temple": "#6D597A",
        "category-experience": "#3E5C76",
        "priority-must": "#0E7C7B",
        "priority-nice": "#6C757D",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "sans-serif"],
      },
      fontSize: {
        "headline-xl": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-lg-mobile": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "700" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      maxWidth: {
        container: "1280px",
      },
      spacing: {
        gutter: "24px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "32px",
      },
      boxShadow: {
        // Soft ambient shadow with a slight primary tint (per DESIGN.md "Elevation").
        ambient: "0px 4px 20px rgba(14, 124, 123, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
