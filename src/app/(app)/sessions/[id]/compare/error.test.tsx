import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CompareError from "./error";

describe("CompareError", () => {
  it("logs the error and wires reset to the retry button", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    const error = new Error("boom");

    render(<CompareError error={error} reset={reset} />);

    expect(consoleError).toHaveBeenCalledWith(error);

    screen.getByRole("button", { name: "Try again" }).click();
    expect(reset).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });
});
