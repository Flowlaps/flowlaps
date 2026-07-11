import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WaitlistSection } from "./waitlist-section";

// WaitlistSection renders WaitlistForm, which calls the joinWaitlist server
// action. Mock it so this test doesn't depend on a live database connection.
vi.mock("@/app/actions/waitlist", () => ({
  joinWaitlist: vi.fn(),
}));

describe("WaitlistSection", () => {
  it("exposes the #waitlist anchor target", () => {
    const { container } = render(<WaitlistSection />);
    expect(container.querySelector("#waitlist")).not.toBeNull();
  });

  it("renders the waitlist form's email input and submit button", () => {
    render(<WaitlistSection />);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Join the waitlist" }),
    ).toBeInTheDocument();
  });
});
