import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import MarketingLayout from "./layout";

describe("MarketingLayout", () => {
  it("scopes the night-session theme to the marketing route only", () => {
    const { container } = render(
      <MarketingLayout>
        <div>content</div>
      </MarketingLayout>,
    );
    expect(container.querySelector(".theme-night")).not.toBeNull();
  });
});
