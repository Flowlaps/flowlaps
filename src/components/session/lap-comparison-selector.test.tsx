import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LapComparisonSelector } from "./lap-comparison-selector";
import type { LapSummary } from "@/types/lap";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/sessions/session-1/compare",
}));

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

describe("LapComparisonSelector", () => {
  it("lists each lap with its formatted time", () => {
    const laps = [
      buildLap({ id: "a", lapNumber: 2, lapTimeMs: 100_000 }),
      buildLap({ id: "b", lapNumber: 3, lapTimeMs: 98_500 }),
    ];
    render(<LapComparisonSelector laps={laps} selectedLapId="a" />);
    expect(screen.getByText(/Lap 2 — 1:40.000/)).toBeInTheDocument();
    expect(screen.getByText(/Lap 3 — 1:38.500/)).toBeInTheDocument();
  });

  it("navigates to the newly selected lap on change", () => {
    const laps = [
      buildLap({ id: "a", lapNumber: 2 }),
      buildLap({ id: "b", lapNumber: 3 }),
    ];
    render(<LapComparisonSelector laps={laps} selectedLapId="a" />);

    fireEvent.change(screen.getByLabelText("Compare against"), { target: { value: "b" } });

    expect(push).toHaveBeenCalledWith("/sessions/session-1/compare?lap=b");
  });
});
