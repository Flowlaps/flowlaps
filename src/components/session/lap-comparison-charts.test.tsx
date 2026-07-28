import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
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
  it("renders the speed, brake, and throttle charts without throwing", () => {
    expect(() =>
      render(<LapComparisonCharts series={series} selectedLapNumber={5} />),
    ).not.toThrow();
  });
});
