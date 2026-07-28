import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LapComparisonSelector } from "./lap-comparison-selector";
import type { LapSummary } from "@/types/lap";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/sessions/session-1/compare",
  useSearchParams: () => searchParams,
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

  it("replaces (not pushes) the URL with the newly selected lap, so switching laps doesn't pollute history", () => {
    searchParams = new URLSearchParams();
    const laps = [
      buildLap({ id: "a", lapNumber: 2 }),
      buildLap({ id: "b", lapNumber: 3 }),
    ];
    render(<LapComparisonSelector laps={laps} selectedLapId="a" />);

    fireEvent.change(screen.getByLabelText("Compare against"), { target: { value: "b" } });

    expect(replace).toHaveBeenCalledWith("/sessions/session-1/compare?lap=b");
  });

  it("preserves other existing query params when switching laps", () => {
    searchParams = new URLSearchParams("lap=a&debug=1");
    const laps = [
      buildLap({ id: "a", lapNumber: 2 }),
      buildLap({ id: "b", lapNumber: 3 }),
    ];
    render(<LapComparisonSelector laps={laps} selectedLapId="a" />);

    fireEvent.change(screen.getByLabelText("Compare against"), { target: { value: "b" } });

    expect(replace).toHaveBeenCalledWith("/sessions/session-1/compare?lap=b&debug=1");
  });
});
