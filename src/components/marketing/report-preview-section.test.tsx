import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportPreviewSection } from "./report-preview-section";

describe("ReportPreviewSection", () => {
  it("introduces the report preview", () => {
    render(<ReportPreviewSection />);
    expect(
      screen.getByText("One habit. One clear next step."),
    ).toBeInTheDocument();
  });

  it("discloses that the mockup is illustrative, not a real session", () => {
    render(<ReportPreviewSection />);
    expect(
      screen.getByText("Example report — not from a real session."),
    ).toBeInTheDocument();
  });

  it("renders the report card mockup", () => {
    render(<ReportPreviewSection />);
    expect(screen.getByText("Session Insights — Monza")).toBeInTheDocument();
  });
});
