import type { Prisma } from "@prisma/client";
import type { NormalizedSession } from "@/lib/import/simhub-csv";
import type { ImportSessionMetadataInput } from "@/lib/validation/import-session";

// SimHub's normalized CSV carries no wall-clock timestamps, so startedAt is
// the import time and endedAt is derived from the sum of lap times rather
// than sourced from the file.
export function buildSessionCreateInput(
  driverId: string,
  metadata: ImportSessionMetadataInput,
  session: NormalizedSession,
  sourceFilename: string,
  startedAt: Date = new Date(),
): Prisma.SessionCreateInput {
  const totalLapMs = session.laps.reduce((sum, lap) => sum + lap.lapTimeMs, 0);
  const endedAt = new Date(startedAt.getTime() + totalLapMs);

  return {
    driver: { connect: { id: driverId } },
    track: { create: { name: metadata.trackName } },
    car: { create: { sim: metadata.sim, className: metadata.carClassName, carName: metadata.carName } },
    sim: metadata.sim,
    sessionType: metadata.sessionType,
    sourceType: "csv",
    sourceFilename,
    startedAt,
    endedAt,
    lapCount: session.lapCount,
    bestLapMs: session.bestLapMs,
    averageLapMs: session.averageLapMs,
    laps: {
      create: session.laps.map((lap) => ({
        lapNumber: lap.lapNumber,
        lapTimeMs: lap.lapTimeMs,
        isValid: lap.isValid,
        sector1Ms: lap.sector1Ms,
        sector2Ms: lap.sector2Ms,
        sector3Ms: lap.sector3Ms,
        telemetryPoints: { create: lap.telemetryPoints },
      })),
    },
  };
}
