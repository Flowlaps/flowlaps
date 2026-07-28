import { describe, expect, it } from "vitest";
import { CHARTS, COMPARISON_CHART_COUNT, formatDistance } from "./comparison-chart-config";

describe("formatDistance", () => {
  it("rounds and appends 'm'", () => {
    expect(formatDistance(123.4)).toBe("123m");
    expect(formatDistance(123.6)).toBe("124m");
  });

  it("coerces string numbers", () => {
    expect(formatDistance("50")).toBe("50m");
  });

  it("rounds negative values", () => {
    expect(formatDistance(-0.4)).toBe("0m");
  });
});

describe("chart formatValue", () => {
  it("rounds and appends the chart's unit", () => {
    const speed = CHARTS.find((chart) => chart.title === "Speed");
    expect(speed?.formatValue(120.6)).toBe("121 kph");

    const brake = CHARTS.find((chart) => chart.title === "Brake");
    expect(brake?.formatValue(45.2)).toBe("45 %");
  });

  it("rounds negative values", () => {
    const speed = CHARTS.find((chart) => chart.title === "Speed");
    expect(speed?.formatValue(-0.4)).toBe("0 kph");
  });
});

describe("COMPARISON_CHART_COUNT", () => {
  it("matches the number of chart specs", () => {
    expect(COMPARISON_CHART_COUNT).toBe(CHARTS.length);
    expect(COMPARISON_CHART_COUNT).toBe(3);
  });
});
