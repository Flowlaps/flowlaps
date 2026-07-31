import type { Prisma } from "@prisma/client";
import type { SessionSummary } from "@/types/session";
import type { LapSummary } from "@/types/lap";

export type SessionWithTrackCarLaps = Prisma.SessionGetPayload<{
  include: { track: true; car: true; laps: true };
}>;

export function mapSessionToSummary(session: SessionWithTrackCarLaps): SessionSummary {
  return {
    id: session.id,
    trackName: session.track.name,
    carName: `${session.car.className} - ${session.car.carName}`,
    sessionType: session.sessionType,
    startedAt: session.startedAt.toISOString(),
    lapCount: session.lapCount,
    bestLapMs: session.bestLapMs,
    averageLapMs: session.averageLapMs,
    consistencyDeltaMs: session.averageLapMs - session.bestLapMs,
  };
}

export function mapLapsToSummaries(laps: SessionWithTrackCarLaps["laps"]): LapSummary[] {
  return laps
    .map((lap) => ({
      id: lap.id,
      sessionId: lap.sessionId,
      lapNumber: lap.lapNumber,
      lapTimeMs: lap.lapTimeMs,
      isValid: lap.isValid,
      sector1Ms: lap.sector1Ms,
      sector2Ms: lap.sector2Ms,
      sector3Ms: lap.sector3Ms,
    }))
    .sort((a, b) => a.lapNumber - b.lapNumber);
}
