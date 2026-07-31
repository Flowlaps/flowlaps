import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ImportPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

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
