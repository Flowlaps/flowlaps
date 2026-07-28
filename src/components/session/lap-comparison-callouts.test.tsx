import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LapComparisonCallouts } from "./lap-comparison-callouts";
import type { ComparisonSummary } from "@/lib/lap-comparison";

describe("LapComparisonCallouts", () => {
  it("shows the overall message and each zone callout", () => {
    const summary: ComparisonSummary = {
      totalTimeLostMs: 1_284,
      overallMessage: "This lap is 1.284s slower than your best, mostly in Sector 2.",
      zoneCallouts: [
        { id: "sector-2", sectorLabel: "Sector 2", message: "You're losing time under braking in Sector 2.", timeLostMs: 900 },
        { id: "sector-3", sectorLabel: "Sector 3", message: "You're carrying less speed through Sector 3.", timeLostMs: 300 },
      ],
    };

    render(<LapComparisonCallouts summary={summary} />);

    expect(
      screen.getByText("This lap is 1.284s slower than your best, mostly in Sector 2."),
    ).toBeInTheDocument();
    expect(screen.getByText("You're losing time under braking in Sector 2.")).toBeInTheDocument();
    expect(screen.getByText("You're carrying less speed through Sector 3.")).toBeInTheDocument();
  });

  it("renders without a zone list when there are no notable losses", () => {
    const summary: ComparisonSummary = {
      totalTimeLostMs: 0,
      overallMessage: "This lap matches or beats your best lap — nice and consistent.",
      zoneCallouts: [],
    };

    render(<LapComparisonCallouts summary={summary} />);

    expect(
      screen.getByText("This lap matches or beats your best lap — nice and consistent."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
