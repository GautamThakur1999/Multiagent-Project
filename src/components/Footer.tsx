import { Container } from "./Layout";

const LINKS = ["Privacy", "Terms", "Destinations", "Press"];

export function Footer() {
  return (
    <footer className="mt-auto bg-surface-container-highest">
      <Container className="flex flex-col items-center justify-between gap-6 py-stack-lg md:flex-row">
        <div className="flex flex-col items-center md:items-start">
          <div className="text-headline-md font-bold text-primary">VoyageAI</div>
          <p className="text-label-sm text-on-surface-variant">
            © 2026 VoyageAI Travel Editorial. All rights reserved.
          </p>
        </div>
        <div className="flex gap-gutter">
          {LINKS.map((l) => (
            <a
              key={l}
              href="#"
              className="text-label-sm text-on-surface-variant transition-colors hover:text-primary"
            >
              {l}
            </a>
          ))}
        </div>
      </Container>
    </footer>
  );
}
