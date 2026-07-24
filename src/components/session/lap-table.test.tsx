import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LapTable } from "./lap-table";
import { getTheoreticalBestSectors } from "@/lib/lap-analysis";
import type { LapSummary } from "@/types/lap";

function buildLap(overrides: Partial<LapSummary>): LapSummary {
  return {
    id: "lap-1",
    sessionId: "session-1",
    lapNumber: 1,
    lapTimeMs: 100_000,
    isValid: true,
    sector1Ms: 33_000,
    sector2Ms: 33_000,
    sector3Ms: 34_000,
    ...overrides,
  };
}

describe("LapTable", () => {
  it("renders one row per lap with its formatted time", () => {
    const laps = [
      buildLap({ id: "a", lapNumber: 1, lapTimeMs: 100_000 }),
      buildLap({ id: "b", lapNumber: 2, lapTimeMs: 98_500 }),
    ];
    render(<LapTable laps={laps} />);
    expect(screen.getByText("1:40.000")).toBeInTheDocument();
    expect(screen.getByText("1:38.500")).toBeInTheDocument();
  });

  it("marks the first lap as an out lap when invalid", () => {
    const laps = [
      buildLap({ id: "a", lapNumber: 1, isValid: false }),
      buildLap({ id: "b", lapNumber: 2 }),
    ];
    render(<LapTable laps={laps} />);
    expect(screen.getByText("Out lap")).toBeInTheDocument();
  });

  it("shows the theoretical best lap combining each sector's fastest time", () => {
    const laps = [
      buildLap({ id: "a", sector1Ms: 30_000, sector2Ms: 35_000, sector3Ms: 36_000, lapTimeMs: 101_000 }),
      buildLap({ id: "b", sector1Ms: 32_000, sector2Ms: 31_000, sector3Ms: 37_000, lapTimeMs: 100_000 }),
    ];
    render(<LapTable laps={laps} bestSectors={getTheoreticalBestSectors(laps)} />);
    expect(screen.getByText(/Theoretical best lap: 1:37.000/)).toBeInTheDocument();
  });

  it("shows a calm message when there are no valid laps", () => {
    const laps = [buildLap({ isValid: false })];
    render(<LapTable laps={laps} bestSectors={getTheoreticalBestSectors(laps)} />);
    expect(screen.getByText("No valid laps yet")).toBeInTheDocument();
  });

  it("renders without throwing and shows the calm message for a fully empty lap list", () => {
    expect(() =>
      render(<LapTable laps={[]} bestSectors={getTheoreticalBestSectors([])} />),
    ).not.toThrow();
    expect(screen.getByText("No valid laps yet")).toBeInTheDocument();
  });
});
