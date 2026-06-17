---
name: Modern Editorial Voyager
colors:
  surface: '#faf9f7'
  surface-dim: '#dadad8'
  surface-bright: '#faf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeec'
  surface-container-high: '#e9e8e6'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#3e4948'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#6e7979'
  outline-variant: '#bdc9c8'
  surface-tint: '#006a69'
  primary: '#006161'
  on-primary: '#ffffff'
  primary-container: '#0e7c7b'
  on-primary-container: '#c3fffd'
  inverse-primary: '#7cd5d3'
  secondary: '#a43c12'
  on-secondary: '#ffffff'
  secondary-container: '#fe7e4f'
  on-secondary-container: '#6b1f00'
  tertiary: '#854524'
  on-tertiary: '#ffffff'
  tertiary-container: '#a35d39'
  on-tertiary-container: '#fff1eb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#98f2f0'
  primary-fixed-dim: '#7cd5d3'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#00504f'
  secondary-fixed: '#ffdbcf'
  secondary-fixed-dim: '#ffb59c'
  on-secondary-fixed: '#380c00'
  on-secondary-fixed-variant: '#822800'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb693'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#713615'
  background: '#faf9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e3e2e0'
  category-food: '#2D6A4F'
  category-temple: '#6D597A'
  category-experience: '#3E5C76'
  priority-must: '#0E7C7B'
  priority-nice: '#6C757D'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is built to evoke the feeling of a premium travel magazine—sophisticated yet deeply accessible. It targets travelers who seek professional-grade planning without the clinical coldness of traditional booking engines. The brand personality is **calm, confidence-inspiring, and editorial**.

We achieve this through a **Modern Editorial** style:
- **Generous Whitespace:** Prioritizing legibility and a sense of "breathable" luxury.
- **Large Photography:** Using high-quality destination imagery as a structural element, not just decoration.
- **Refined Materiality:** Subtle shadows and soft background tints replace heavy borders to create a layered, organized information hierarchy.
- **Intentional Contrast:** A deep, authoritative primary color paired with a vibrant, high-energy accent to guide the user's journey.

## Colors

The palette is anchored by **Deep Teal (#0E7C7B)**, representing the stability of the ocean and professional reliability. The **Coral Accent** is reserved strictly for primary calls to action (CTAs) and "success" moments to maintain its impact.

The background uses a **Soft Neutral Off-White (#F9F8F6)** rather than pure white to reduce eye strain and provide a warmer, paper-like feel. 

**Categorical Colors:**
- **Food (Green):** A desaturated forest green to feel organic.
- **Temple (Purple):** A muted plum to signify tradition and spirituality.
- **Experience (Blue):** A slate blue to represent activity and movement.

## Typography

This design system utilizes **Plus Jakarta Sans** for all levels to maintain a friendly, geometric, and contemporary feel. 

**Hierarchy Rules:**
- **Headlines:** Use tight letter spacing (-0.01em to -0.02em) and heavy weights to create a strong editorial "anchor" on the page.
- **Body Text:** Set with generous line heights to ensure long itineraries are easy to scan and digest.
- **Labels:** Use uppercase for `label-sm` (tags and pills) to distinguish metadata from body content.

## Layout & Spacing

The layout follows a **Hybrid Grid** model:
- **Desktop:** A 12-column fluid grid within a 1280px max-width container. Itinerary views use a 2/3 (Main) and 1/3 (Sidebar) split.
- **Mobile:** A single-column flow with 20px side margins. 

**Spacing Rhythm:**
Use a base-8 scale for all internal element spacing. Vertical stacks between itinerary items should be `stack-md` (16px), while spacing between days or major sections should be `stack-lg` (32px) to provide clear visual separation.

## Elevation & Depth

To maintain the premium editorial feel, we avoid heavy, dark shadows. Instead, we use:
- **Tonal Elevation:** The main background is the off-white neutral. Cards are pure white (#FFFFFF) to make them "pop" subtly.
- **Soft Ambient Shadows:** Use a very diffused shadow for active cards: `0px 4px 20px rgba(14, 124, 123, 0.08)`. Note the slight primary-color tint in the shadow to keep it warm.
- **Border Accents:** Instead of shadows for every element, use 1px solid strokes in a slightly darker neutral tint (#E5E2DE) for secondary cards like "Nice-to-have" details.

## Shapes

The shape language is **distinctly rounded** to feel approachable and modern. 
- **Cards:** Apply a 16px (`rounded-xl`) corner radius.
- **Input Fields & Buttons:** Apply a 12px (`rounded-lg`) corner radius.
- **Pills & Tags:** Use full-round (pill) shapes for "Must-do" and "Nice-to-have" statuses to differentiate them from square-ish category tags.

## Components

**Buttons:**
- **Primary:** Coral background, white text, bold weight. Use for "Plan my trip" and "Book" actions.
- **Secondary:** Deep teal outline or ghost style for "Edit" or "Regenerate" actions.

**Pills & Tags:**
- **Category Tags:** Rectangular with 4px radius. Small `label-sm` text. Background is a 10% opacity version of the category color with a 100% opacity text color.
- **Priority Pills:** Full pill shape. "Must-do" uses a solid Teal background; "Nice-to-have" uses a soft gray (#F0F0F0) background with dark text.

**Itinerary Cards:**
- White background, 16px radius, soft ambient shadow.
- Include a vertical "time-line" indicator on the left for morning/afternoon/evening blocks.

**Status Badges:**
- Used in the sidebar "Compliance" card. Use a small circular checkmark icon in Primary Teal.