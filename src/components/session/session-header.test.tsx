import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionHeader } from "./session-header";
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

describe("SessionHeader", () => {
  it("shows the track, session type, and car", () => {
    render(<SessionHeader session={session} />);
    expect(screen.getByRole("heading", { name: "Spa-Francorchamps" })).toBeInTheDocument();
    expect(screen.getByText("Practice")).toBeInTheDocument();
    expect(screen.getByText(/GT3 - Porsche 992/)).toBeInTheDocument();
  });

  it("links back to the dashboard", () => {
    render(<SessionHeader session={session} />);
    expect(screen.getByText("Back to dashboard").closest("a")).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
