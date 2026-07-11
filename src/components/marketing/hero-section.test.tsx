import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./hero-section";

describe("HeroSection", () => {
  it("leads with the headline", () => {
    render(<HeroSection />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Stay in the flow." }),
    ).toBeInTheDocument();
  });

  it("links the primary CTA to the waitlist section", () => {
    render(<HeroSection />);
    expect(
      screen.getByRole("link", { name: "Join the waitlist" }),
    ).toHaveAttribute("href", "#waitlist");
  });

  it("links the secondary CTA to how it works", () => {
    render(<HeroSection />);
    expect(
      screen.getByRole("link", { name: "See how it works" }),
    ).toHaveAttribute("href", "#how-it-works");
  });

  it("hides the decorative racing-line background from assistive tech", () => {
    const { container } = render(<HeroSection />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden");
    expect(svg).toHaveClass("pointer-events-none");
  });
});
