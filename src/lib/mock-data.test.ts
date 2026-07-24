import { describe, expect, it } from "vitest";
import { mockSessions, mockCoachingReports, mockLaps } from "./mock-data";

describe("mock data integrity", () => {
  it("limits each coaching report to at most 3 focus areas", () => {
    for (const report of mockCoachingReports) {
      expect(report.focusAreas.length).toBeLessThanOrEqual(3);
      expect(report.focusAreas.length).toBeGreaterThan(0);
    }
  });

  it("gives every coaching report a practice plan", () => {
    for (const report of mockCoachingReports) {
      expect(report.practicePlan.length).toBeGreaterThan(0);
    }
  });

  it("every session has a non-negative consistency delta", () => {
    for (const session of mockSessions) {
      expect(session.consistencyDeltaMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("every session's best lap is no slower than its average lap", () => {
    for (const session of mockSessions) {
      expect(session.bestLapMs).toBeLessThanOrEqual(session.averageLapMs);
    }
  });

  it("every coaching report references a real session", () => {
    const sessionIds = new Set(mockSessions.map((session) => session.id));
    for (const report of mockCoachingReports) {
      expect(sessionIds.has(report.sessionId)).toBe(true);
    }
  });
});

describe("mock lap data integrity", () => {
  it("generates exactly lapCount laps for every session", () => {
    for (const session of mockSessions) {
      expect(mockLaps[session.id]).toHaveLength(session.lapCount);
    }
  });

  it("has a valid lap matching the session's recorded best lap time", () => {
    for (const session of mockSessions) {
      const laps = mockLaps[session.id];
      const bestValidLapMs = Math.min(
        ...laps.filter((lap) => lap.isValid).map((lap) => lap.lapTimeMs),
      );
      expect(bestValidLapMs).toBe(session.bestLapMs);
    }
  });

  it("always sums sector times to exactly the lap time", () => {
    for (const laps of Object.values(mockLaps)) {
      for (const lap of laps) {
        expect(lap.sector1Ms + lap.sector2Ms + lap.sector3Ms).toBe(lap.lapTimeMs);
      }
    }
  });

  it("marks the first lap of a multi-lap session as an invalid out lap", () => {
    for (const session of mockSessions) {
      if (session.lapCount <= 1) continue;
      expect(mockLaps[session.id][0].isValid).toBe(false);
    }
  });

  it("numbers laps sequentially starting at 1", () => {
    for (const laps of Object.values(mockLaps)) {
      expect(laps.map((lap) => lap.lapNumber)).toEqual(
        Array.from({ length: laps.length }, (_, index) => index + 1),
      );
    }
  });
});
