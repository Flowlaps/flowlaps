import { describe, expect, it } from "vitest";
import {
  buildDriverSeedInput,
  buildFocusAreaSeedInput,
  buildTelemetrySeedInput,
  buildTrackSeedInput,
  parseCarLabel,
} from "./seed-data";
import { mockCoachingReports, mockLaps, mockSessions } from "@/lib/mock-data";
import { generateLapTelemetry } from "@/lib/mock-telemetry";

describe("parseCarLabel", () => {
  it("splits a '{className} - {carName}' label", () => {
    expect(parseCarLabel("GT3 - Porsche 992")).toEqual({
      className: "GT3",
      carName: "Porsche 992",
    });
  });

  it("falls back to a default class when there's no separator", () => {
    expect(parseCarLabel("Formula 3")).toEqual({ className: "GT3", carName: "Formula 3" });
  });
});

describe("buildTrackSeedInput", () => {
  it("returns known details for a track in the mock data", () => {
    expect(buildTrackSeedInput("Monza")).toEqual({
      name: "Monza",
      layout: "Grand Prix",
      countryCode: "IT",
    });
  });

  it("falls back to the raw name with no country code for an unknown track", () => {
    expect(buildTrackSeedInput("Road America")).toEqual({
      name: "Road America",
      layout: "Grand Prix",
      countryCode: "",
    });
  });
});

describe("buildTelemetrySeedInput", () => {
  const session = mockSessions[0];
  const lap = mockLaps[session.id][0];

  it("produces one row per telemetry sample, indexed from zero", () => {
    const rows = buildTelemetrySeedInput(session, lap);
    const points = generateLapTelemetry(session, lap);
    expect(rows).toHaveLength(points.length);
    expect(rows.map((row) => row.sampleIndex)).toEqual(points.map((_, index) => index));
  });

  it("integrates a monotonically increasing timestamp starting at zero", () => {
    const rows = buildTelemetrySeedInput(session, lap);
    expect(rows[0].timestampMs).toBe(0);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].timestampMs).toBeGreaterThanOrEqual(rows[i - 1].timestampMs);
    }
  });

  it("keeps gear within a plausible 1-6 range", () => {
    const rows = buildTelemetrySeedInput(session, lap);
    for (const row of rows) {
      expect(row.gear).toBeGreaterThanOrEqual(1);
      expect(row.gear).toBeLessThanOrEqual(6);
    }
  });
});

describe("buildFocusAreaSeedInput", () => {
  it("assigns sequential priority and reuses the title as description", () => {
    const rows = buildFocusAreaSeedInput([
      "Delay braking into Les Combes and Bus Stop",
      "Commit to throttle earlier at Stowe exit",
      "Stay consistent across the final sector",
    ]);

    expect(rows.map((row) => row.priority)).toEqual([1, 2, 3]);
    expect(rows.map((row) => row.category)).toEqual(["braking", "throttle", "consistency"]);
    expect(rows.every((row) => row.description === row.title)).toBe(true);
  });

  it("categorizes anything else as general", () => {
    const [row] = buildFocusAreaSeedInput(["Trust front grip through the Karussell"]);
    expect(row.category).toBe("general");
  });
});

describe("buildDriverSeedInput", () => {
  const driverInput = buildDriverSeedInput();

  it("nests one session per mock session, each with the right lap count", () => {
    expect(driverInput.sessions?.create).toHaveLength(mockSessions.length);

    const sessionInputs = driverInput.sessions?.create;
    if (!Array.isArray(sessionInputs)) throw new Error("expected an array of session inputs");

    mockSessions.forEach((session, index) => {
      const laps = sessionInputs[index].laps;
      if (!laps || !("create" in laps) || !Array.isArray(laps.create)) {
        throw new Error("expected nested lap creates");
      }
      expect(laps.create).toHaveLength(session.lapCount);
    });
  });

  it("only attaches a coaching report to sessions that have one in mock data", () => {
    const sessionInputs = driverInput.sessions?.create;
    if (!Array.isArray(sessionInputs)) throw new Error("expected an array of session inputs");

    mockSessions.forEach((session, index) => {
      const hasMockReport = mockCoachingReports.some((report) => report.sessionId === session.id);
      expect(Boolean(sessionInputs[index].coachingReports)).toBe(hasMockReport);
    });
  });

  it("joins the mock practice plan into nextPracticePlan text", () => {
    const sessionInputs = driverInput.sessions?.create;
    if (!Array.isArray(sessionInputs)) throw new Error("expected an array of session inputs");

    const sessionIndex = mockSessions.findIndex((session) => session.id === mockCoachingReports[0].sessionId);
    const reportInput = sessionInputs[sessionIndex].coachingReports;
    if (!reportInput || !("create" in reportInput)) throw new Error("expected a nested report create");
    const [report] = reportInput.create as { nextPracticePlan: string }[];

    expect(report.nextPracticePlan).toBe(mockCoachingReports[0].practicePlan.join("\n"));
  });
});
