import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionReportCard } from "./session-report-card";

describe("SessionReportCard", () => {
  it("names the session", () => {
    render(<SessionReportCard />);
    expect(screen.getByText("Session Insights — Monza")).toBeInTheDocument();
  });

  it("shows exactly one habit and one next step, in calm plain language", () => {
    render(<SessionReportCard />);
    expect(screen.getByText("Habit")).toBeInTheDocument();
    expect(screen.getByText("Coasting into Turn 1.")).toBeInTheDocument();
    expect(screen.getByText("Try this next")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stay committed to the throttle a little longer into Turn 1 before you brake.",
      ),
    ).toBeInTheDocument();
  });

  it("does not reference exact distances, boards, or numeric precision (calm coaching tone)", () => {
    render(<SessionReportCard />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/\d+\s*m\b|board|%/i);
  });

  it("has a visible border and shadow so it lifts off the dark background", () => {
    render(<SessionReportCard />);
    const card = screen.getByText("Session Insights — Monza").closest(
      '[data-slot="card"]',
    );
    expect(card).toHaveClass("border");
    expect(card).toHaveClass("shadow-2xl");
  });
});
