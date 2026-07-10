import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiSummary } from "./kpi-summary";
import type { SessionSummary } from "@/types/session";
import type { CoachingReportSummary } from "@/types/coaching-report";

function buildSession(overrides: Partial<SessionSummary>): SessionSummary {
  return {
    id: "session-1",
    trackName: "Monza",
    carName: "GT3 - Ferrari 296",
    sessionType: "practice",
    startedAt: "2026-07-01T00:00:00.000Z",
    lapCount: 10,
    bestLapMs: 100_000,
    averageLapMs: 101_000,
    consistencyDeltaMs: 1_000,
    ...overrides,
  };
}

describe("KpiSummary", () => {
  it("reports the session count", () => {
    render(<KpiSummary sessions={[buildSession({})]} />);
    expect(screen.getByText("Sessions logged")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("surfaces the fastest lap across sessions with its track", () => {
    const sessions = [
      buildSession({ id: "a", trackName: "Monza", bestLapMs: 108_642 }),
      buildSession({ id: "b", trackName: "Spa-Francorchamps", bestLapMs: 138_412 }),
    ];
    render(<KpiSummary sessions={sessions} />);
    expect(screen.getByText("1:48.642")).toBeInTheDocument();
    expect(screen.getByText("Outright, at Monza")).toBeInTheDocument();
  });

  it("averages the consistency delta across all sessions", () => {
    const sessions = [
      buildSession({ id: "a", consistencyDeltaMs: 1_000 }),
      buildSession({ id: "b", consistencyDeltaMs: 3_000 }),
    ];
    render(<KpiSummary sessions={sessions} />);
    expect(screen.getByText("±2.0s")).toBeInTheDocument();
  });

  it("shows the focus area count from the latest report when provided", () => {
    const report: CoachingReportSummary = {
      id: "report-1",
      sessionId: "session-1",
      createdAt: "2026-07-01T00:00:00.000Z",
      summary: "Test summary",
      focusAreas: ["Area one", "Area two"],
      practicePlan: ["Step one"],
    };
    render(<KpiSummary sessions={[buildSession({})]} latestReport={report} />);
    expect(screen.getByText("Focus areas")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows zero focus areas when there is no latest report", () => {
    render(<KpiSummary sessions={[buildSession({})]} />);
    const focusAreasLabel = screen.getByText("Focus areas");
    expect(focusAreasLabel.parentElement).toHaveTextContent("0");
  });

  it("does not crash with a single session (regression: reduce needs an explicit seed)", () => {
    expect(() => render(<KpiSummary sessions={[buildSession({})]} />)).not.toThrow();
  });
});
