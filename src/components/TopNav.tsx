"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./Layout";

const LINKS = [
  { label: "Discover", href: "/" },
  { label: "My Trips", href: "/trips" },
  { label: "Community", href: "/community" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-md">
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="text-headline-md font-bold text-primary">
          VoyageAI
        </Link>

        <nav className="hidden items-center gap-gutter md:flex">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.label}
                href={l.href}
                className={`text-body-md transition-colors hover:text-primary ${
                  active ? "border-b-2 border-primary pb-1 text-primary" : "text-on-surface-variant"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button className="hidden text-label-md text-on-surface-variant transition-colors hover:text-primary md:block">
            Sign In
          </button>
          <Link
            href="/"
            className="rounded-full bg-secondary px-6 py-2.5 text-label-md font-semibold text-on-secondary shadow-sm transition-all hover:brightness-110 active:scale-95"
          >
            Plan New Trip
          </Link>
        </div>
      </Container>
    </header>
  );
}
