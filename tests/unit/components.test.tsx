import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Tag } from "@/components/Tag";
import { PriorityPill } from "@/components/PriorityPill";
import { Card } from "@/components/Card";
import { ConstraintSummary } from "@/components/ConstraintSummary";
import { ClarificationPanel } from "@/components/ClarificationPanel";
import { LandingHero } from "@/components/LandingHero";
import type { TripConstraints } from "@/lib/types";

afterEach(cleanup);

const JAPAN: TripConstraints = {
  destination: "Japan",
  duration_days: 5,
  cities: ["Tokyo", "Kyoto"],
  budget_usd: 3000,
  currency: "USD",
  preferences: ["food", "temples"],
  avoidances: ["crowds"],
  travelers: 1,
  pace: "moderate",
  clarifications_needed: [],
};

describe("Button", () => {
  it("renders the coral primary variant and handles clicks", () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" onClick={onClick}>
        Go
      </Button>
    );
    const btn = screen.getByRole("button", { name: "Go" });
    expect(btn.className).toContain("bg-secondary");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders the teal secondary variant", () => {
    render(<Button variant="secondary">Build</Button>);
    expect(screen.getByRole("button", { name: "Build" }).className).toContain("bg-primary");
  });
});

describe("Chip", () => {
  it("fires onClick when interactive", () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Tokyo</Chip>);
    fireEvent.click(screen.getByRole("button", { name: /Tokyo/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("fires onRemove from the remove affordance", () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Tokyo</Chip>);
    fireEvent.click(screen.getByLabelText("Remove"));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe("Tag", () => {
  it("applies the category color", () => {
    render(<Tag label="Food" category="food" />);
    expect(screen.getByText("Food").className).toContain("text-category-food");
  });
});

describe("PriorityPill", () => {
  it("renders both priorities", () => {
    render(<PriorityPill priority="must-do" />);
    expect(screen.getByText("Must-do")).toBeInTheDocument();
    cleanup();
    render(<PriorityPill priority="nice-to-have" />);
    expect(screen.getByText("Nice-to-have")).toBeInTheDocument();
  });
});

describe("Card", () => {
  it("adds the ambient shadow when elevated", () => {
    const { container } = render(<Card elevated>hi</Card>);
    expect(container.firstChild).toHaveClass("shadow-ambient");
  });
});

describe("ConstraintSummary", () => {
  it("renders the parsed constraints as editable fields", () => {
    render(<ConstraintSummary value={JAPAN} onChange={() => {}} />);
    expect(screen.getByLabelText("Destination")).toHaveValue("Japan");
    expect(screen.getByLabelText("Duration in days")).toHaveValue(5);
    expect(screen.getByLabelText("Budget in USD")).toHaveValue(3000);
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
    expect(screen.getByText("Kyoto")).toBeInTheDocument();
    expect(screen.getByText("food")).toBeInTheDocument();
    expect(screen.getByText("crowds")).toBeInTheDocument();
  });

  it("calls onChange when the destination is edited", () => {
    const onChange = vi.fn();
    render(<ConstraintSummary value={JAPAN} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Destination"), { target: { value: "France" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ destination: "France" }));
  });

  it("calls onChange without a city when it is removed", () => {
    const onChange = vi.fn();
    render(<ConstraintSummary value={JAPAN} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Remove Tokyo"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ cities: ["Kyoto"] }));
  });
});

describe("ClarificationPanel", () => {
  it("lists each clarification question", () => {
    render(
      <ClarificationPanel
        clarifications={["How many days will your trip be?", "What is your budget?"]}
        partial={{ destination: "Japan" }}
      />
    );
    expect(screen.getByText("How many days will your trip be?")).toBeInTheDocument();
    expect(screen.getByText("What is your budget?")).toBeInTheDocument();
  });
});

describe("LandingHero", () => {
  it("submits the typed request", () => {
    const onSubmit = vi.fn();
    render(<LandingHero onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Describe your trip"), {
      target: { value: "Trip to Japan" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Plan my trip/i }));
    expect(onSubmit).toHaveBeenCalledWith("Trip to Japan");
  });

  it("does not submit empty input", () => {
    const onSubmit = vi.fn();
    render(<LandingHero onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /Plan my trip/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("fills the input when an example chip is clicked", () => {
    render(<LandingHero onSubmit={() => {}} />);
    fireEvent.click(screen.getByText(/Tuscany/));
    const input = screen.getByLabelText("Describe your trip") as HTMLInputElement;
    expect(input.value).toContain("Tuscany");
  });
});
