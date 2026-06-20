"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "./Icon";

const PLACEHOLDER =
  "Plan a 5-day trip to Japan. Tokyo + Kyoto. $3,000 budget. Love food and temples, hate crowds.";

const EXAMPLES = [
  "7 days in Tuscany, wine & rustic villas",
  "Surfing & yoga in Bali, budget friendly",
  "Nordic design tour through Copenhagen",
];

export function LandingHero({ onSubmit }: { onSubmit: (request: string) => void }) {
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <section className="px-margin-mobile pb-24 pt-16 md:px-0">
      <div className="mx-auto max-w-[900px] text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-1.5 text-on-primary-fixed-variant">
          <Icon name="auto_awesome" className="text-[18px]" />
          <span className="text-label-sm uppercase tracking-wider">AI-Powered Editorial Travel</span>
        </div>

        <h1 className="mb-6 text-headline-lg tracking-tight text-on-surface md:text-headline-xl">
          Your next journey, <span className="italic text-primary">tailored by intelligence.</span>
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-body-lg text-on-surface-variant">
          The precision of professional planning meets the soul of a travel magazine. Tell us your
          dream, and we&apos;ll curate the rest.
        </p>

        <form onSubmit={submit} className="mx-auto mb-8 max-w-3xl">
          <div className="flex flex-col items-stretch gap-2 rounded-3xl bg-surface-container-lowest p-2 shadow-ambient focus-within:ring-2 focus-within:ring-primary/20 md:flex-row md:items-center md:p-3">
            <div className="flex flex-grow items-center gap-3 px-4 py-2">
              <Icon name="search" className="text-[28px] text-primary" />
              <input
                aria-label="Describe your trip"
                className="w-full border-none bg-transparent py-2 text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                placeholder={PLACEHOLDER}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-2xl bg-secondary px-8 py-4 text-label-md font-semibold text-on-secondary transition-all hover:brightness-110 active:scale-95"
            >
              <span>Plan my trip</span>
              <Icon name="arrow_forward" />
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setValue(ex)}
              className="rounded-full border border-outline-variant bg-surface px-4 py-2 text-label-md text-on-surface-variant transition-all hover:border-primary hover:bg-primary-fixed hover:text-on-primary-fixed-variant"
            >
              &ldquo;{ex}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
