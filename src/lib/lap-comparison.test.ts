import { describe, expect, it } from "vitest";
import { buildComparisonSeries, buildComparisonSummary, resampleToDistanceGrid } from "./lap-comparison";
import { generateLapTelemetry } from "./mock-telemetry";
import type { SessionSummary } from "@/types/session";
import type { LapSummary } from "@/types/lap";
import type { TelemetryPoint } from "@/types/telemetry";

function point(overrides: Partial<TelemetryPoint>): TelemetryPoint {
  return {
    lapId: "lap-1",
    distanceMeters: 0,
    speedKph: 0,
    throttlePct: 0,
    brakePct: 0,
    ...overrides,
  };
}

function buildSession(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: "session-1",
    trackName: "Spa-Francorchamps",
    carName: "GT3 - Porsche 992",
    sessionType: "practice",
    startedAt: "2026-07-09T18:30:00.000Z",
    lapCount: 10,
    bestLapMs: 138_412,
    averageLapMs: 140_890,
    consistencyDeltaMs: 2_478,
    ...overrides,
  };
}

function buildLap(overrides: Partial<LapSummary> = {}): LapSummary {
  return {
    id: "session-1-lap-1",
    sessionId: "session-1",
    lapNumber: 1,
    lapTimeMs: 138_412,
    isValid: true,
    sector1Ms: 45_000,
    sector2Ms: 46_000,
    sector3Ms: 47_412,
    ...overrides,
  };
}

describe("resampleToDistanceGrid", () => {
  it("returns exact sample values when the grid lands on real distances (mock data no-op case)", () => {
    const session = buildSession();
    const lap = buildLap();
    const telemetry = generateLapTelemetry(session, lap);
    const nativeGrid = telemetry.map((p) => p.distanceMeters);

    const resampled = resampleToDistanceGrid(telemetry, nativeGrid);

    expect(resampled).toEqual(telemetry);
  });

  it("linearly interpolates between the two real samples bracketing a grid distance", () => {
    const points: TelemetryPoint[] = [
      point({ distanceMeters: 0, speedKph: 100, brakePct: 0, throttlePct: 100 }),
      point({ distanceMeters: 40, speedKph: 60, brakePct: 80, throttlePct: 0 }),
    ];

    const resampled = resampleToDistanceGrid(points, [0, 10, 40]);

    expect(resampled[1].distanceMeters).toBe(10);
    // 10 is 25% of the way from 0 to 40 -> 25% of the way from each field's start to end value.
    expect(resampled[1].speedKph).toBeCloseTo(90, 5);
    expect(resampled[1].brakePct).toBeCloseTo(20, 5);
    expect(resampled[1].throttlePct).toBeCloseTo(75, 5);
    expect(resampled[2]).toEqual(points[1]);
  });

  it("holds the single sample's value across the whole grid for a one-point lap", () => {
    const points: TelemetryPoint[] = [point({ distanceMeters: 0, speedKph: 150 })];

    const resampled = resampleToDistanceGrid(points, [0, 5, 10]);

    expect(resampled.every((p) => p.speedKph === 150)).toBe(true);
  });

  it("returns an empty array for a lap with no telemetry", () => {
    expect(resampleToDistanceGrid([], [0, 10])).toEqual([]);
  });
});

describe("buildComparisonSeries", () => {
  it("zips two telemetry series by matching distance", () => {
    const session = buildSession();
    const bestLap = buildLap({ id: "best" });
    const selectedLap = buildLap({ id: "selected", lapTimeMs: session.bestLapMs + 3_000 });

    const series = buildComparisonSeries(
      generateLapTelemetry(session, bestLap),
      generateLapTelemetry(session, selectedLap),
    );

    expect(series.length).toBeGreaterThan(0);
    expect(series[0].distanceMeters).toBe(0);
    expect(series.every((point) => Number.isFinite(point.bestSpeedKph))).toBe(true);
    expect(series.every((point) => Number.isFinite(point.selectedSpeedKph))).toBe(true);
  });

  it("aligns two laps with different sample counts and uneven, non-matching distance steps (real CSV import shape)", () => {
    // Best lap: fewer, unevenly-spaced samples (as if logged at a lower rate).
    const bestLapTelemetry: TelemetryPoint[] = [
      point({ lapId: "best", distanceMeters: 0, speedKph: 80 }),
      point({ lapId: "best", distanceMeters: 33, speedKph: 120 }),
      point({ lapId: "best", distanceMeters: 91, speedKph: 200 }),
      point({ lapId: "best", distanceMeters: 150, speedKph: 180 }),
    ];
    // Selected lap: more, differently-spaced samples, and a shorter total
    // distance covered - buildComparisonSeries should clip to the shorter one.
    const selectedLapTelemetry: TelemetryPoint[] = [
      point({ lapId: "selected", distanceMeters: 0, speedKph: 75 }),
      point({ lapId: "selected", distanceMeters: 18, speedKph: 95 }),
      point({ lapId: "selected", distanceMeters: 47, speedKph: 140 }),
      point({ lapId: "selected", distanceMeters: 72, speedKph: 175 }),
      point({ lapId: "selected", distanceMeters: 110, speedKph: 190 }),
    ];

    const series = buildComparisonSeries(bestLapTelemetry, selectedLapTelemetry);

    expect(series.length).toBeGreaterThan(1);
    expect(series[0].distanceMeters).toBe(0);
    expect(series[series.length - 1].distanceMeters).toBe(110);
    // Every point must come from a real distance covered by both laps -
    // the whole point of resampling is that these never desync.
    for (const p of series) {
      expect(p.distanceMeters).toBeLessThanOrEqual(110);
      expect(Number.isFinite(p.bestSpeedKph)).toBe(true);
      expect(Number.isFinite(p.selectedSpeedKph)).toBe(true);
    }
  });

  it("returns an empty series when either lap has no telemetry", () => {
    expect(buildComparisonSeries([], [point({})])).toEqual([]);
    expect(buildComparisonSeries([point({})], [])).toEqual([]);
  });
});

describe("buildComparisonSummary", () => {
  it("returns at most 3 zone callouts, sorted by time lost descending", () => {
    const session = buildSession();
    const bestLap = buildLap({ id: "best" });
    const selectedLap = buildLap({ id: "selected", lapTimeMs: session.bestLapMs + 4_000 });

    const series = buildComparisonSeries(
      generateLapTelemetry(session, bestLap),
      generateLapTelemetry(session, selectedLap),
    );
    const summary = buildComparisonSummary(series, bestLap, selectedLap);

    expect(summary.zoneCallouts.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < summary.zoneCallouts.length; i++) {
      expect(summary.zoneCallouts[i - 1].timeLostMs).toBeGreaterThanOrEqual(
        summary.zoneCallouts[i].timeLostMs,
      );
    }
    for (const callout of summary.zoneCallouts) {
      expect(callout.message.length).toBeGreaterThan(0);
    }
  });

  it("reports the exact lap time delta as the total time lost", () => {
    const session = buildSession();
    const bestLap = buildLap({ id: "best", lapTimeMs: session.bestLapMs });
    const selectedLap = buildLap({ id: "selected", lapTimeMs: session.bestLapMs + 2_500 });

    const series = buildComparisonSeries(
      generateLapTelemetry(session, bestLap),
      generateLapTelemetry(session, selectedLap),
    );
    const summary = buildComparisonSummary(series, bestLap, selectedLap);

    expect(summary.totalTimeLostMs).toBe(2_500);
    expect(summary.overallMessage).toContain("2.500s slower");
  });

  it("gives a calm message with no zone callouts when the selected lap is the best lap itself", () => {
    const session = buildSession();
    const bestLap = buildLap({ id: "best", lapTimeMs: session.bestLapMs });

    const telemetry = generateLapTelemetry(session, bestLap);
    const series = buildComparisonSeries(telemetry, telemetry);
    const summary = buildComparisonSummary(series, bestLap, bestLap);

    expect(summary.zoneCallouts).toHaveLength(0);
    expect(summary.overallMessage).toMatch(/matches or beats/);
  });
});
