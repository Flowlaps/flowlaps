import { describe, expect, it } from "vitest";
import { buildComparisonSeries, buildComparisonSummary } from "./lap-comparison";
import { generateLapTelemetry } from "./mock-telemetry";
import type { SessionSummary } from "@/types/session";
import type { LapSummary } from "@/types/lap";

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
