/**
 * Sprint 1 placeholder page.
 * Its only job is to prove the design tokens resolve through Tailwind.
 * The real Landing screen is built in Sprint 7 (see ImplementationPlan.md).
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-container flex-col items-start justify-center gap-stack-lg px-margin-mobile md:px-margin-desktop">
      <span
        data-testid="token-badge"
        className="rounded-full bg-primary-container px-4 py-1 text-label-sm uppercase text-on-primary-container shadow-ambient"
      >
        Design tokens wired
      </span>
      <h1 className="text-headline-lg text-on-surface md:text-headline-xl">
        AI Travel Planner
      </h1>
      <p className="max-w-2xl text-body-lg text-on-surface-variant">
        Tell us your trip in a sentence. Get a plan you can actually follow — on
        budget, on time, on taste.
      </p>
      <div className="flex flex-wrap gap-stack-md">
        <span className="rounded-sm bg-category-food/10 px-3 py-1 text-label-sm uppercase text-category-food">
          Food
        </span>
        <span className="rounded-sm bg-category-temple/10 px-3 py-1 text-label-sm uppercase text-category-temple">
          Temple
        </span>
        <span className="rounded-sm bg-category-experience/10 px-3 py-1 text-label-sm uppercase text-category-experience">
          Experience
        </span>
        <span className="rounded-full bg-priority-must px-3 py-1 text-label-sm uppercase text-on-primary">
          Must-do
        </span>
      </div>
    </main>
  );
}
