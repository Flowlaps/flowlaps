import { describe, expect, it } from "vitest";
import { mapSessionToSummary, mapLapsToSummaries, type SessionWithTrackCarLaps } from "./map-session-for-view";

const session: SessionWithTrackCarLaps = {
  id: "session-1",
  driverId: "driver-1",
  trackId: "track-1",
  carId: "car-1",
  sim: "Assetto Corsa Competizione",
  sessionType: "practice",
  sourceType: "csv",
  sourceFilename: "session.csv",
  startedAt: new Date("2026-07-29T12:00:00.000Z"),
  endedAt: new Date("2026-07-29T12:30:00.000Z"),
  lapCount: 2,
  bestLapMs: 90_500,
  averageLapMs: 92_000,
  createdAt: new Date("2026-07-29T12:30:00.000Z"),
  updatedAt: new Date("2026-07-29T12:30:00.000Z"),
  track: {
    id: "track-1",
    name: "Spa-Francorchamps",
    layout: null,
    countryCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  car: {
    id: "car-1",
    sim: "Assetto Corsa Competizione",
    className: "GT3",
    carName: "Porsche 992",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  laps: [
    {
      id: "lap-2",
      sessionId: "session-1",
      lapNumber: 2,
      lapTimeMs: 93_500,
      isValid: true,
      sector1Ms: 31_000,
      sector2Ms: 31_000,
      sector3Ms: 31_500,
      createdAt: new Date(),
    },
    {
      id: "lap-1",
      sessionId: "session-1",
      lapNumber: 1,
      lapTimeMs: 90_500,
      isValid: true,
      sector1Ms: 30_100,
      sector2Ms: 30_200,
      sector3Ms: 30_200,
      createdAt: new Date(),
    },
  ],
};

describe("mapSessionToSummary", () => {
  it("maps track/car relations and derives consistencyDeltaMs", () => {
    const summary = mapSessionToSummary(session);

    expect(summary).toEqual({
      id: "session-1",
      trackName: "Spa-Francorchamps",
      carName: "GT3 - Porsche 992",
      sessionType: "practice",
      startedAt: "2026-07-29T12:00:00.000Z",
      lapCount: 2,
      bestLapMs: 90_500,
      averageLapMs: 92_000,
      consistencyDeltaMs: 1_500,
    });
  });
});

describe("mapLapsToSummaries", () => {
  it("maps every lap and sorts by lap number", () => {
    const laps = mapLapsToSummaries(session.laps);

    expect(laps.map((lap) => lap.lapNumber)).toEqual([1, 2]);
    expect(laps[0]).toEqual({
      id: "lap-1",
      sessionId: "session-1",
      lapNumber: 1,
      lapTimeMs: 90_500,
      isValid: true,
      sector1Ms: 30_100,
      sector2Ms: 30_200,
      sector3Ms: 30_200,
    });
  });
});
