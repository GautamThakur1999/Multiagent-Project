import type { LogisticsLeg, StayRecommendation } from "@/lib/types";
import { formatNightlyRate, formatCostOrDash } from "@/lib/format";
import { Card } from "./Card";
import { Icon } from "./Icon";

function IconBox({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
      <Icon name={name} />
    </div>
  );
}

export function LogisticsCard({
  stays,
  legs,
}: {
  stays: StayRecommendation[];
  legs: LogisticsLeg[];
}) {
  const interCity = legs.filter((l) => l.leg_type === "inter-city");

  return (
    <Card elevated className="p-stack-md">
      <h4 className="mb-4 text-lg font-bold text-on-surface">Stay & Logistics</h4>
      <div className="space-y-4">
        {stays.map((stay, i) => (
          <div key={`stay-${i}`} className="flex items-start gap-4">
            <IconBox name="hotel" />
            <div>
              <div className="text-label-md font-semibold text-on-surface">
                {stay.neighborhood}, {stay.city}
              </div>
              <div className="text-label-sm text-on-surface-variant">
                {stay.nights} night{stay.nights > 1 ? "s" : ""} ·{" "}
                {formatNightlyRate(
                  stay.price_range_usd_per_night.min,
                  stay.price_range_usd_per_night.max
                )}
              </div>
            </div>
          </div>
        ))}
        {interCity.map((leg, i) => (
          <div key={`leg-${i}`} className="flex items-start gap-4">
            <IconBox name="train" />
            <div>
              <div className="text-label-md font-semibold text-on-surface">{leg.mode}</div>
              <div className="text-label-sm text-on-surface-variant">
                {leg.from} → {leg.to} · {Math.round((leg.duration_minutes / 60) * 10) / 10}h ·{" "}
                {formatCostOrDash(leg.est_cost_usd)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
