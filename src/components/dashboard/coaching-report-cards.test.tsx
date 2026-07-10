import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoachingReportCards } from "./coaching-report-cards";
import type { CoachingReportSummary } from "@/types/coaching-report";
import type { SessionSummary } from "@/types/session";

const session: SessionSummary = {
  id: "session-1",
  trackName: "Spa-Francorchamps",
  carName: "GT3 - Porsche 992",
  sessionType: "practice",
  startedAt: "2026-07-09T18:30:00.000Z",
  lapCount: 14,
  bestLapMs: 138_412,
  averageLapMs: 140_890,
  consistencyDeltaMs: 2_478,
};

const report: CoachingReportSummary = {
  id: "report-1",
  sessionId: "session-1",
  createdAt: "2026-07-09T19:10:00.000Z",
  summary: "You are braking too early overall in the heaviest braking zones.",
  focusAreas: ["Delay braking into Les Combes", "Smooth throttle pickup"],
  practicePlan: ["Run 5 laps focused only on braking point at Les Combes"],
};

describe("CoachingReportCards", () => {
  it("renders the summary, focus areas, and practice plan for a report", () => {
    render(
      <CoachingReportCards
        reports={[report]}
        sessionsById={new Map([[session.id, session]])}
      />,
    );

    expect(screen.getByText(session.trackName)).toBeInTheDocument();
    expect(screen.getByText(report.summary)).toBeInTheDocument();
    for (const area of report.focusAreas) {
      expect(screen.getByText(area)).toBeInTheDocument();
    }
    expect(screen.getByText("Next practice")).toBeInTheDocument();
    for (const step of report.practicePlan) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });

  it("falls back to a generic label when the session lookup misses", () => {
    render(<CoachingReportCards reports={[report]} sessionsById={new Map()} />);
    expect(screen.getByText("Session")).toBeInTheDocument();
  });

  it("links each card to the session's report page", () => {
    render(
      <CoachingReportCards
        reports={[report]}
        sessionsById={new Map([[session.id, session]])}
      />,
    );
    expect(screen.getByText(report.summary).closest("a")).toHaveAttribute(
      "href",
      "/sessions/session-1/report",
    );
  });
});
