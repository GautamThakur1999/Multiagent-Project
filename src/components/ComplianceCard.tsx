import type { ReviewCheck, ReviewResult } from "@/lib/types";
import { Card } from "./Card";
import { Icon } from "./Icon";

const CHECK_LABEL: Record<string, string> = {
  fits_duration: "Fits your dates",
  includes_all_cities: "Visits all your cities",
  within_budget: "Within budget",
  matches_preferences: "Matches your interests",
  avoids_crowds: "Avoids crowds",
  travel_time_realistic: "Realistic travel times",
};

const STATUS_ICON: Record<ReviewCheck["status"], { name: string; className: string }> = {
  pass: { name: "check_circle", className: "text-primary" },
  warning: { name: "warning", className: "text-tertiary" },
  fail: { name: "error", className: "text-error" },
};

export function ComplianceCard({ review }: { review: ReviewResult }) {
  return (
    <Card className="p-stack-md">
      <div className="mb-4 flex items-center gap-2">
        <h4 className="text-label-md font-bold text-on-surface">Trip Compliance</h4>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-label-sm ${
            review.overall === "pass"
              ? "bg-priority-must/10 text-priority-must"
              : "bg-error/10 text-error"
          }`}
        >
          {review.overall === "pass" ? "All checks passed" : "Needs attention"}
        </span>
      </div>
      <ul className="space-y-3">
        {review.checks.map((check, i) => {
          const icon = STATUS_ICON[check.status];
          return (
            <li key={i} className="flex items-start gap-3">
              <Icon name={icon.name} filled className={`text-[20px] ${icon.className}`} />
              <div>
                <div className="text-body-md text-on-surface">
                  {CHECK_LABEL[check.check] ?? check.check}
                </div>
                {check.status !== "pass" && (
                  <div className="text-label-sm text-on-surface-variant">{check.reason}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
