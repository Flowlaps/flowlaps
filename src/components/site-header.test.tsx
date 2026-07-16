import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("links the logo to the given href", () => {
    render(
      <SiteHeader logoHref="/dashboard">
        <span>actions</span>
      </SiteHeader>,
    );
    expect(screen.getByRole("link", { name: "Flowlaps" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("renders the provided children", () => {
    render(
      <SiteHeader logoHref="/">
        <span>Join the waitlist</span>
      </SiteHeader>,
    );
    expect(screen.getByText("Join the waitlist")).toBeInTheDocument();
  });

  it("always scopes itself to the night theme, regardless of the surrounding page", () => {
    const { container } = render(
      <SiteHeader logoHref="/">
        <span>actions</span>
      </SiteHeader>,
    );
    expect(container.querySelector(".theme-night")).not.toBeNull();
  });
});
