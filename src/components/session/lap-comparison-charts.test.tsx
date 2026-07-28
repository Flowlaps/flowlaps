import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LapComparisonCharts } from "./lap-comparison-charts";
import type { ComparisonPoint } from "@/lib/lap-comparison";

const series: ComparisonPoint[] = [
  {
    distanceMeters: 0,
    bestSpeedKph: 260,
    selectedSpeedKph: 250,
    bestBrakePct: 0,
    selectedBrakePct: 0,
    bestThrottlePct: 100,
    selectedThrottlePct: 100,
  },
  {
    distanceMeters: 25,
    bestSpeedKph: 180,
    selectedSpeedKph: 170,
    bestBrakePct: 60,
    selectedBrakePct: 70,
    bestThrottlePct: 0,
    selectedThrottlePct: 0,
  },
];

describe("LapComparisonCharts", () => {
  it("renders a card for each of speed, brake, and throttle", () => {
    render(<LapComparisonCharts series={series} selectedLapNumber={5} />);
    expect(screen.getByText("Speed")).toBeInTheDocument();
    expect(screen.getByText("Brake")).toBeInTheDocument();
    expect(screen.getByText("Throttle")).toBeInTheDocument();
  });

  it("gives each chart an accessible label naming the metric and laps being compared", () => {
    render(<LapComparisonCharts series={series} selectedLapNumber={5} />);
    expect(
      screen.getByRole("img", { name: "Speed comparison: best lap versus lap 5" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Brake comparison: best lap versus lap 5" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Throttle comparison: best lap versus lap 5" }),
    ).toBeInTheDocument();
  });
});
