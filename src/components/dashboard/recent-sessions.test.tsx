import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentSessions } from "./recent-sessions";
import type { SessionSummary } from "@/types/session";

const sessions: SessionSummary[] = [
  {
    id: "session-1",
    trackName: "Spa-Francorchamps",
    carName: "GT3 - Porsche 992",
    sessionType: "practice",
    startedAt: "2026-07-09T18:30:00.000Z",
    lapCount: 14,
    bestLapMs: 138_412,
    averageLapMs: 140_890,
    consistencyDeltaMs: 2_478,
  },
  {
    id: "session-2",
    trackName: "Monza",
    carName: "GT3 - Ferrari 296",
    sessionType: "qualifying",
    startedAt: "2026-07-03T21:00:00.000Z",
    lapCount: 6,
    bestLapMs: 108_642,
    averageLapMs: 109_501,
    consistencyDeltaMs: 859,
  },
];

describe("RecentSessions", () => {
  it("renders a row per session with track, car, type, and lap info", () => {
    render(<RecentSessions sessions={sessions} />);

    expect(screen.getByText("Spa-Francorchamps")).toBeInTheDocument();
    expect(screen.getByText("Practice")).toBeInTheDocument();
    expect(screen.getByText("2:18.412")).toBeInTheDocument();
    expect(screen.getByText("14 laps")).toBeInTheDocument();

    expect(screen.getByText("Monza")).toBeInTheDocument();
    expect(screen.getByText("Qualifying")).toBeInTheDocument();
    expect(screen.getByText("1:48.642")).toBeInTheDocument();
    expect(screen.getByText("6 laps")).toBeInTheDocument();
  });

  it("links each row to its session detail page", () => {
    render(<RecentSessions sessions={sessions} />);
    expect(screen.getByText("Spa-Francorchamps").closest("a")).toHaveAttribute(
      "href",
      "/sessions/session-1",
    );
    expect(screen.getByText("Monza").closest("a")).toHaveAttribute(
      "href",
      "/sessions/session-2",
    );
  });
});
