import { describe, expect, it } from "vitest";
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
    id: "session-1-lap-3",
    sessionId: "session-1",
    lapNumber: 3,
    lapTimeMs: 138_412,
    isValid: true,
    sector1Ms: 45_000,
    sector2Ms: 46_000,
    sector3Ms: 47_412,
    ...overrides,
  };
}

describe("generateLapTelemetry", () => {
  it("is deterministic for the same session and lap", () => {
    const session = buildSession();
    const lap = buildLap();
    expect(generateLapTelemetry(session, lap)).toEqual(generateLapTelemetry(session, lap));
  });

  it("samples from distance 0 through the full lap distance", () => {
    const points = generateLapTelemetry(buildSession(), buildLap());
    expect(points[0].distanceMeters).toBe(0);
    expect(points[points.length - 1].distanceMeters).toBeGreaterThan(4000);
    expect(points.length).toBeGreaterThan(100);
  });

  it("keeps throttle and brake within 0-100 and speed non-negative", () => {
    const points = generateLapTelemetry(buildSession(), buildLap({ lapTimeMs: 145_000 }));
    for (const point of points) {
      expect(point.throttlePct).toBeGreaterThanOrEqual(0);
      expect(point.throttlePct).toBeLessThanOrEqual(100);
      expect(point.brakePct).toBeGreaterThanOrEqual(0);
      expect(point.brakePct).toBeLessThanOrEqual(100);
      expect(point.speedKph).toBeGreaterThan(0);
    }
  });

  it("tags every point with the lap id", () => {
    const lap = buildLap({ id: "session-1-lap-7" });
    const points = generateLapTelemetry(buildSession(), lap);
    expect(points.every((point) => point.lapId === "session-1-lap-7")).toBe(true);
  });

  it("produces a slower average speed for a slower lap than the session best", () => {
    const session = buildSession();
    const bestLap = buildLap({ id: "best", lapTimeMs: session.bestLapMs });
    const slowerLap = buildLap({ id: "slower", lapTimeMs: session.bestLapMs + 4_000 });

    const bestPoints = generateLapTelemetry(session, bestLap);
    const slowerPoints = generateLapTelemetry(session, slowerLap);

    const average = (points: { speedKph: number }[]) =>
      points.reduce((sum, point) => sum + point.speedKph, 0) / points.length;

    expect(average(slowerPoints)).toBeLessThan(average(bestPoints));
  });
});
