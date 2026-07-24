import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionKpis } from "./session-kpis";
import type { SessionSummary } from "@/types/session";

const session: SessionSummary = {
  id: "session-1",
  trackName: "Monza",
  carName: "GT3 - Ferrari 296",
  sessionType: "practice",
  startedAt: "2026-07-01T00:00:00.000Z",
  lapCount: 10,
  bestLapMs: 108_642,
  averageLapMs: 109_501,
  consistencyDeltaMs: 859,
};

describe("SessionKpis", () => {
  it("shows best lap, average lap, and consistency", () => {
    render(<SessionKpis session={session} />);
    expect(screen.getByText("Best lap")).toBeInTheDocument();
    expect(screen.getByText("1:48.642")).toBeInTheDocument();
    expect(screen.getByText("Average lap")).toBeInTheDocument();
    expect(screen.getByText("1:49.501")).toBeInTheDocument();
    expect(screen.getByText("Consistency")).toBeInTheDocument();
    expect(screen.getByText("±0.9s")).toBeInTheDocument();
  });

  it("shows the theoretical best when provided", () => {
    render(<SessionKpis session={session} theoreticalBestMs={107_900} />);
    expect(screen.getByText("Theoretical best")).toBeInTheDocument();
    expect(screen.getByText("1:47.900")).toBeInTheDocument();
  });

  it("shows a placeholder when there is no theoretical best yet", () => {
    render(<SessionKpis session={session} />);
    const label = screen.getByText("Theoretical best");
    expect(label.parentElement).toHaveTextContent("—");
  });
});
