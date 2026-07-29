import { describe, expect, it } from "vitest";
import { buildSessionCreateInput } from "./build-session-input";
import type { NormalizedSession } from "./simhub-csv";
import type { ImportSessionMetadataInput } from "@/lib/validation/import-session";

const metadata: ImportSessionMetadataInput = {
  sim: "Assetto Corsa Competizione",
  trackName: "Spa-Francorchamps",
  carClassName: "GT3",
  carName: "Porsche 992",
  sessionType: "practice",
};

const normalizedSession: NormalizedSession = {
  lapCount: 1,
  bestLapMs: 90_500,
  averageLapMs: 90_500,
  laps: [
    {
      lapNumber: 1,
      lapTimeMs: 90_500,
      isValid: true,
      sector1Ms: 30_100,
      sector2Ms: 30_200,
      sector3Ms: 30_200,
      telemetryPoints: [
        {
          sampleIndex: 0,
          timestampMs: 0,
          distanceMeters: 0,
          speedKph: 180,
          throttlePct: 100,
          brakePct: 0,
          steeringAngleDeg: 0,
          gear: 3,
          rpm: 6500,
        },
      ],
    },
  ],
};

describe("buildSessionCreateInput", () => {
  it("maps normalized session data and metadata into a Prisma create input", () => {
    const input = buildSessionCreateInput("driver-1", metadata, normalizedSession, "session.csv");

    expect(input).toMatchObject({
      driver: { connect: { id: "driver-1" } },
      track: { create: { name: "Spa-Francorchamps" } },
      car: { create: { sim: "Assetto Corsa Competizione", className: "GT3", carName: "Porsche 992" } },
      sim: "Assetto Corsa Competizione",
      sessionType: "practice",
      sourceType: "csv",
      sourceFilename: "session.csv",
      lapCount: 1,
      bestLapMs: 90_500,
      averageLapMs: 90_500,
    });
  });

  it("derives endedAt from startedAt plus the sum of lap times", () => {
    const input = buildSessionCreateInput("driver-1", metadata, normalizedSession, "session.csv");

    const startedAt = input.startedAt as Date;
    const endedAt = input.endedAt as Date;
    expect(endedAt.getTime() - startedAt.getTime()).toBe(90_500);
  });

  it("accepts an explicit startedAt for deterministic tests", () => {
    const fixedStart = new Date("2026-07-29T12:00:00.000Z");
    const input = buildSessionCreateInput(
      "driver-1",
      metadata,
      normalizedSession,
      "session.csv",
      fixedStart,
    );

    expect(input.startedAt).toBe(fixedStart);
    expect((input.endedAt as Date).toISOString()).toBe("2026-07-29T12:01:30.500Z");
  });

  it("carries every lap's telemetry points through unchanged", () => {
    const input = buildSessionCreateInput("driver-1", metadata, normalizedSession, "session.csv");

    const lapsCreate = (input.laps as { create: unknown[] }).create;
    expect(lapsCreate).toHaveLength(1);
    expect(lapsCreate[0]).toMatchObject({
      lapNumber: 1,
      lapTimeMs: 90_500,
      isValid: true,
      sector1Ms: 30_100,
      telemetryPoints: { create: normalizedSession.laps[0].telemetryPoints },
    });
  });
});
