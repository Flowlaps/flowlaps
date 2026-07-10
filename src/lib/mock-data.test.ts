import { describe, expect, it } from "vitest";
import { mockSessions, mockCoachingReports } from "./mock-data";

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
