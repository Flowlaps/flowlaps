import type { Prisma } from "@prisma/client";
import type { SessionSummary } from "@/types/session";
import type { LapSummary } from "@/types/lap";
import type { CoachingReportSummary } from "@/types/coaching-report";

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

export type CoachingReportWithFocusAreas = Prisma.CoachingReportGetPayload<{
  include: { focusAreas: true };
}>;

// Reverses seed-data.ts's buildCoachingReportSeedInput mapping: focusAreas
// are stored as individual rows ordered by priority, and the practice plan
// is stored as a single newline-joined string rather than an array.
export function mapCoachingReportToSummary(
  report: CoachingReportWithFocusAreas,
): CoachingReportSummary {
  return {
    id: report.id,
    sessionId: report.sessionId,
    createdAt: report.createdAt.toISOString(),
    summary: report.summary,
    focusAreas: [...report.focusAreas]
      .sort((a, b) => a.priority - b.priority)
      .map((area) => area.title),
    practicePlan: report.nextPracticePlan.split("\n"),
  };
}
