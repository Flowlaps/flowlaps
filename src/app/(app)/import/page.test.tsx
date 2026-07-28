import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ImportPage from "./page";

describe("ImportPage", () => {
  it("renders the upload form", () => {
    render(<ImportPage />);

    expect(
      screen.getByRole("heading", { name: "Import a session" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Session CSV")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload session" }),
    ).toBeInTheDocument();
  });
});
