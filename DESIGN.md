# DESIGN.md - AI Travel Planner Design System

This document serves as the foundational design system and styling guide for the AI Travel Planner. Feed this context into Stitch by Google (or any AI UI generator) to ensure consistency, accessibility, and a premium user experience across all generated screens.

## 1. Design Principles & Vibe
* **Calm & Trustworthy:** Travel planning is often overwhelming. The UI must feel like a breath of fresh air. Use ample whitespace, clear visual hierarchies, and avoid cluttered interfaces.
* **Smart & Opinionated:** Information should be structured. Use badges, distinct typography, and subtle highlights to differentiate "Must-do" vs. "Nice-to-have".
* **Responsive & Fluid:** The layout must work flawlessly on mobile (where travelers check their plans) and desktop (where they do deep planning).

## 2. Color Palette
We use a modern, nature-inspired palette that evokes travel (oceans, sunsets, forests) while maintaining high contrast for usability.

* **Primary (Brand & Main Actions):**
  * `Primary-600`: `#0F766E` (Deep Teal) - Used for primary buttons, active states, and brand highlights.
  * `Primary-50`: `#F0FDFA` (Light Teal/Mint) - Used for subtle backgrounds and highlighted cards.
* **Accent (Energy & Warnings):**
  * `Accent-500`: `#F97316` (Vibrant Orange) - Used for "Must-do" tags, attention-grabbing interactive elements, and CTA highlights.
* **Semantic Colors:**
  * `Success`: `#10B981` (Emerald Green) - Used for budget-compliant badges ("Under $3000") and verified constraint checks.
  * `Warning/Crowds`: `#F59E0B` (Amber) - Used to flag crowded times or budget warnings.
  * `Error`: `#EF4444` (Red) - Used for budget overshoots or impossible logistics.
* **Neutrals (Text, Backgrounds, Borders):**
  * `Background`: `#F8FAFC` (Slate 50) - App background color.
  * `Surface`: `#FFFFFF` (White) - Card and container backgrounds.
  * `Text-Primary`: `#0F172A` (Slate 900) - Headings and primary body text.
  * `Text-Secondary`: `#475569` (Slate 600) - Subtitles, metadata, and descriptions.
  * `Border`: `#E2E8F0` (Slate 200) - Dividers and card outlines.

## 3. Typography
Use modern, clean, and highly legible fonts available via Google Fonts.

* **Primary Font (Headings & Accents):** `Plus Jakarta Sans`, sans-serif.
  * *Weights:* 600 (Semibold), 700 (Bold), 800 (ExtraBold).
  * *Usage:* Page titles, Day headers, prominent price tags.
* **Secondary Font (Body, UI elements, Data):** `Inter`, sans-serif.
  * *Weights:* 400 (Regular), 500 (Medium).
  * *Usage:* Itinerary descriptions, button text, badges, input fields.

## 4. UI Components & Styling Rules

### Buttons
* **Primary Button:** Background `#0F766E`, Text `#FFFFFF`, rounded corners (`rounded-xl` or `12px`), subtle hover shadow (`shadow-md`). Font: Inter Medium.
* **Secondary Button:** Background `#FFFFFF`, Border `1px solid #E2E8F0`, Text `#0F172A`, hover background `#F8FAFC`.
* **Ghost/Text Button:** No background, Text `#0F766E`, underline on hover.

### Cards & Surfaces
* **Standard Card:** Background `#FFFFFF`, border `1px solid #E2E8F0`, rounded corners (`rounded-2xl` or `16px`), soft shadow (`shadow-sm`).
* **Itinerary Item Card:** Must feature a left border to indicate time blocks (e.g., Morning = Orange border, Afternoon = Teal border). Include a 16px padding.

### Badges & Tags
* **Constraint Badge (Success):** Background `#D1FAE5`, Text `#065F46`, Icon (Checkmark). `rounded-full`, 12px font size.
* **Preference Tag:** Background `#F1F5F9`, Text `#475569`. Used for "Food", "Temples", "Low Crowd".
* **Must-Do Tag:** Background `#FFEDD5`, Text `#C2410C`, font weight bold.

### Forms & Inputs
* **The "One-Sentence" Input:** Should be oversized (Text size 20px+), mimicking a natural conversation rather than a traditional form. No heavy borders, just a sleek bottom border or a large floating soft-shadow box.

## 5. Iconography
* Recommend using **Lucide Icons** (lucide-react) or **Heroicons** for clean, stroke-based iconography (e.g., MapPin, Clock, DollarSign, Users, Sparkles).
