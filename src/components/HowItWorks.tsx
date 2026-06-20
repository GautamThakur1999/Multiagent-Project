import { Container } from "./Layout";
import { Icon } from "./Icon";

const STEPS = [
  {
    icon: "edit_note",
    iconClass: "bg-primary/10 text-primary",
    title: "Describe your trip",
    body: "Speak your mind. No filters, no forms. Just your vision in plain English.",
  },
  {
    icon: "auto_awesome",
    iconClass: "bg-secondary/10 text-secondary",
    title: "Our AI agents plan it",
    body: "Specialist agents research, route, and budget your trip in parallel — then review it.",
  },
  {
    icon: "map",
    iconClass: "bg-tertiary/10 text-tertiary",
    title: "Fits budget & taste",
    body: "Receive a magazine-quality itinerary that respects your wallet and your style.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-surface-container-low py-24">
      <Container>
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-headline-lg text-on-surface">Effortless Discovery</h2>
          <p className="text-body-md text-on-surface-variant">
            Three steps to your most memorable escape.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-stack-lg text-center shadow-ambient"
            >
              <div
                className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${step.iconClass}`}
              >
                <Icon name={step.icon} className="text-[32px]" filled={i === 1} />
              </div>
              <h3 className="mb-3 text-headline-md">{step.title}</h3>
              <p className="text-body-md text-on-surface-variant">{step.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
