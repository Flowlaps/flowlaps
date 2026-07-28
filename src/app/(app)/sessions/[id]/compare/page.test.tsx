import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ComparePage from "./page";
import type { SessionSummary } from "@/types/session";
import type { LapSummary } from "@/types/lap";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push, replace }),
    usePathname: () => "/sessions/session-full/compare",
    useSearchParams: () => new URLSearchParams(),
  };
});

function buildSession(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: "session-full",
    trackName: "Test Track",
    carName: "Test Car",
    sessionType: "practice",
    startedAt: "2026-01-01T00:00:00.000Z",
    lapCount: 3,
    bestLapMs: 100_000,
    averageLapMs: 102_000,
    consistencyDeltaMs: 2_000,
    ...overrides,
  };
}

function buildLap(overrides: Partial<LapSummary>): LapSummary {
  return {
    id: "lap-1",
    sessionId: "session-full",
    lapNumber: 1,
    lapTimeMs: 100_000,
    isValid: true,
    sector1Ms: 33_000,
    sector2Ms: 33_000,
    sector3Ms: 34_000,
    ...overrides,
  };
}

vi.mock("@/lib/mock-data", () => ({
  mockSessions: [
    buildSession({ id: "session-full" }),
    buildSession({ id: "session-empty", lapCount: 1 }),
  ],
  mockLaps: {
    "session-full": [
      buildLap({ id: "session-full-lap-1", lapNumber: 1, lapTimeMs: 100_000 }),
      buildLap({ id: "session-full-lap-2", lapNumber: 2, lapTimeMs: 102_000 }),
      buildLap({ id: "session-full-lap-3", lapNumber: 3, lapTimeMs: 103_000 }),
    ],
    "session-empty": [buildLap({ id: "session-empty-lap-1", lapNumber: 1, lapTimeMs: 100_000 })],
  },
}));

describe("ComparePage", () => {
  it("throws (triggering the not-found boundary) when the session id doesn't exist", async () => {
    await expect(
      ComparePage({
        params: Promise.resolve({ id: "does-not-exist" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow();
  });

  it("shows the calm empty state when a session doesn't have a second valid lap to compare", async () => {
    const jsx = await ComparePage({
      params: Promise.resolve({ id: "session-empty" }),
      searchParams: Promise.resolve({}),
    });
    render(jsx);

    expect(screen.getByText("Not enough laps to compare yet.")).toBeInTheDocument();
    expect(screen.queryByText("Lap comparison")).not.toBeInTheDocument();
  });

  it("renders the comparison against the first comparable lap by default", async () => {
    const jsx = await ComparePage({
      params: Promise.resolve({ id: "session-full" }),
      searchParams: Promise.resolve({}),
    });
    render(jsx);

    expect(screen.getByText("Lap comparison")).toBeInTheDocument();
    expect(screen.getByText(/Best lap: Lap 1/)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("session-full-lap-2");
  });

  it("renders the comparison against the lap requested via the lap search param", async () => {
    const jsx = await ComparePage({
      params: Promise.resolve({ id: "session-full" }),
      searchParams: Promise.resolve({ lap: "session-full-lap-3" }),
    });
    render(jsx);

    expect(screen.getByRole("combobox")).toHaveValue("session-full-lap-3");
  });
});
