import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("shows a calm empty message with a CTA into the import flow", () => {
    render(<EmptyState />);
    expect(screen.getByText("No sessions yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Import a session" })).toHaveAttribute(
      "href",
      "/import",
    );
  });
});
