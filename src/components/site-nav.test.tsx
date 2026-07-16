import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteNav } from "./site-nav";

describe("SiteNav", () => {
  it("links the logo back to the dashboard", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "Flowlaps" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("links to every primary app route", () => {
    render(<SiteNav />);
    const routes: [string, string][] = [
      ["Dashboard", "/dashboard"],
      ["Import", "/import"],
      ["History", "/history"],
      ["Settings", "/settings"],
    ];
    for (const [label, href] of routes) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    }
  });
});
