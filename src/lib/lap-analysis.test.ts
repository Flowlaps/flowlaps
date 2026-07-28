import { describe, expect, it } from "vitest";
import { getBestLap, getTheoreticalBestSectors, resolveLapComparison } from "./lap-analysis";
import type { LapSummary } from "@/types/lap";

function buildLap(overrides: Partial<LapSummary>): LapSummary {
  return {
    id: "lap-1",
    sessionId: "session-1",
    lapNumber: 1,
    lapTimeMs: 100_000,
    isValid: true,
    sector1Ms: 33_000,
    sector2Ms: 33_000,
    sector3Ms: 34_000,
    ...overrides,
  };
}

describe("getBestLap", () => {
  it("returns the fastest valid lap", () => {
    const laps = [
      buildLap({ id: "a", lapTimeMs: 105_000 }),
      buildLap({ id: "b", lapTimeMs: 98_000 }),
      buildLap({ id: "c", lapTimeMs: 101_000 }),
    ];
    expect(getBestLap(laps)?.id).toBe("b");
  });

  it("ignores invalid laps even if they are faster", () => {
    const laps = [
      buildLap({ id: "a", lapTimeMs: 90_000, isValid: false }),
      buildLap({ id: "b", lapTimeMs: 98_000 }),
    ];
    expect(getBestLap(laps)?.id).toBe("b");
  });

  it("returns undefined when there are no valid laps", () => {
    const laps = [buildLap({ isValid: false })];
    expect(getBestLap(laps)).toBeUndefined();
  });

  it("returns undefined for an empty lap list", () => {
    expect(getBestLap([])).toBeUndefined();
  });
});

describe("getTheoreticalBestSectors", () => {
  it("combines the best sector time from each column, even across different laps", () => {
    const laps = [
      buildLap({ id: "a", sector1Ms: 30_000, sector2Ms: 35_000, sector3Ms: 36_000 }),
      buildLap({ id: "b", sector1Ms: 32_000, sector2Ms: 31_000, sector3Ms: 37_000 }),
      buildLap({ id: "c", sector1Ms: 33_000, sector2Ms: 34_000, sector3Ms: 33_000 }),
    ];
    expect(getTheoreticalBestSectors(laps)).toEqual({
      sector1Ms: 30_000,
      sector2Ms: 31_000,
      sector3Ms: 33_000,
      theoreticalBestMs: 94_000,
    });
  });

  it("excludes invalid laps from the comparison", () => {
    const laps = [
      buildLap({ id: "a", sector1Ms: 10_000, isValid: false }),
      buildLap({ id: "b", sector1Ms: 30_000 }),
    ];
    expect(getTheoreticalBestSectors(laps)?.sector1Ms).toBe(30_000);
  });

  it("returns undefined when there are no valid laps", () => {
    expect(getTheoreticalBestSectors([buildLap({ isValid: false })])).toBeUndefined();
  });
});

describe("resolveLapComparison", () => {
  it("excludes the best lap from the comparable laps", () => {
    const laps = [
      buildLap({ id: "a", lapTimeMs: 98_000 }),
      buildLap({ id: "b", lapTimeMs: 101_000 }),
      buildLap({ id: "c", lapTimeMs: 102_000 }),
    ];
    const result = resolveLapComparison(laps, undefined);
    expect(result?.bestLap.id).toBe("a");
    expect(result?.comparableLaps.map((lap) => lap.id)).toEqual(["b", "c"]);
  });

  it("selects the requested lap when its id matches a comparable lap", () => {
    const laps = [
      buildLap({ id: "a", lapTimeMs: 98_000 }),
      buildLap({ id: "b", lapTimeMs: 101_000 }),
      buildLap({ id: "c", lapTimeMs: 102_000 }),
    ];
    expect(resolveLapComparison(laps, "c")?.selectedLap.id).toBe("c");
  });

  it("falls back to the first comparable lap when the requested id doesn't match", () => {
    const laps = [
      buildLap({ id: "a", lapTimeMs: 98_000 }),
      buildLap({ id: "b", lapTimeMs: 101_000 }),
    ];
    expect(resolveLapComparison(laps, "does-not-exist")?.selectedLap.id).toBe("b");
    expect(resolveLapComparison(laps, undefined)?.selectedLap.id).toBe("b");
  });

  it("excludes invalid (out) laps from the comparable laps", () => {
    const laps = [
      buildLap({ id: "a", lapTimeMs: 98_000, isValid: false }),
      buildLap({ id: "b", lapTimeMs: 101_000 }),
      buildLap({ id: "c", lapTimeMs: 102_000, isValid: false }),
      buildLap({ id: "d", lapTimeMs: 103_000 }),
    ];
    const result = resolveLapComparison(laps, undefined);
    expect(result?.bestLap.id).toBe("b");
    expect(result?.comparableLaps.map((lap) => lap.id)).toEqual(["d"]);
  });

  it("returns undefined when there is no valid best lap", () => {
    expect(resolveLapComparison([buildLap({ isValid: false })], undefined)).toBeUndefined();
  });

  it("returns undefined when there is no second valid lap to compare against", () => {
    const laps = [buildLap({ id: "a", lapTimeMs: 98_000 })];
    expect(resolveLapComparison(laps, undefined)).toBeUndefined();
  });
});
