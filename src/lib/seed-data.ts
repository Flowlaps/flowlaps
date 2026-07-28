import type { Prisma } from "@prisma/client";
import type { SessionSummary } from "@/types/session";
import { mockSessions, mockLaps, mockCoachingReports } from "@/lib/mock-data";
import { generateLapTelemetry } from "@/lib/mock-telemetry";

// All mock sessions were recorded on the same sim for seed purposes; real
// per-session sim identity arrives with CSV import (Ticket 6/7).
const SIM_NAME = "iRacing";
const SAMPLE_STEP_M = 25; // must match mock-telemetry.ts's fixed sample spacing

interface TrackSeedInput {
  name: string;
  layout: string;
  countryCode: string;
}

const TRACK_DETAILS: Record<string, TrackSeedInput> = {
  "Spa-Francorchamps": { name: "Spa-Francorchamps", layout: "Grand Prix", countryCode: "BE" },
  "Silverstone GP": { name: "Silverstone", layout: "Grand Prix", countryCode: "GB" },
  "Nürburgring GP": { name: "Nürburgring", layout: "Grand Prix", countryCode: "DE" },
  Monza: { name: "Monza", layout: "Grand Prix", countryCode: "IT" },
};

export function buildTrackSeedInput(trackName: string): TrackSeedInput {
  return TRACK_DETAILS[trackName] ?? { name: trackName, layout: "Grand Prix", countryCode: "" };
}

// Mock car labels are formatted "{className} - {carName}" (e.g. "GT3 - Porsche 992").
export function parseCarLabel(label: string): { className: string; carName: string } {
  const separatorIndex = label.indexOf(" - ");
  if (separatorIndex === -1) {
    return { className: "GT3", carName: label };
  }
  return {
    className: label.slice(0, separatorIndex),
    carName: label.slice(separatorIndex + 3),
  };
}

// Rough gear band from speed alone - just enough for schema-valid, plausible
// seed data. Real gear comes from CSV import, not this heuristic.
function estimateGear(speedKph: number): number {
  return Math.min(6, Math.max(1, Math.round(speedKph / 45) + 1));
}

// Builds full-fidelity telemetry rows for one lap from the same deterministic
// generator the UI already uses for mocked charts, so seeded data matches
// what's shown on screen. timestampMs is integrated from speed rather than
// invented, so it stays internally consistent with the rest of the row.
// steeringAngleDeg isn't modeled yet - kept at 0 until real CSV import data
// exists (Ticket 6/7) rather than fabricating a steering curve here.
export function buildTelemetrySeedInput(
  session: SessionSummary,
  lap: (typeof mockLaps)[string][number],
): Prisma.TelemetryPointCreateManyLapInput[] {
  const points = generateLapTelemetry(session, lap);
  let elapsedMs = 0;

  return points.map((point, index) => {
    if (index > 0) {
      const previous = points[index - 1];
      const avgSpeedMps = Math.max(1, (previous.speedKph + point.speedKph) / 2 / 3.6);
      elapsedMs += Math.round((SAMPLE_STEP_M / avgSpeedMps) * 1000);
    }

    return {
      sampleIndex: index,
      timestampMs: elapsedMs,
      distanceMeters: point.distanceMeters,
      speedKph: point.speedKph,
      throttlePct: point.throttlePct,
      brakePct: point.brakePct,
      steeringAngleDeg: 0,
      gear: estimateGear(point.speedKph),
    };
  });
}

function categorizeFocusArea(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("brak")) return "braking";
  if (lower.includes("throttle") || lower.includes("exit") || lower.includes("commit")) return "throttle";
  if (lower.includes("consisten")) return "consistency";
  return "general";
}

// Mock focus areas are already short, actionable phrases with no separate
// long-form description, so title and description reuse the same text here.
export function buildFocusAreaSeedInput(
  focusAreas: string[],
): Prisma.PracticeFocusAreaCreateManyReportInput[] {
  return focusAreas.map((title, index) => ({
    category: categorizeFocusArea(title),
    title,
    description: title,
    priority: index + 1,
  }));
}

function buildLapSeedInput(
  session: SessionSummary,
  lap: (typeof mockLaps)[string][number],
): Prisma.LapCreateWithoutSessionInput {
  return {
    lapNumber: lap.lapNumber,
    lapTimeMs: lap.lapTimeMs,
    isValid: lap.isValid,
    sector1Ms: lap.sector1Ms,
    sector2Ms: lap.sector2Ms,
    sector3Ms: lap.sector3Ms,
    telemetryPoints: { createMany: { data: buildTelemetrySeedInput(session, lap) } },
  };
}

function buildCoachingReportSeedInput(
  report: (typeof mockCoachingReports)[number],
): Prisma.CoachingReportCreateWithoutSessionInput {
  return {
    summary: report.summary,
    nextPracticePlan: report.practicePlan.join("\n"),
    createdAt: new Date(report.createdAt),
    focusAreas: { createMany: { data: buildFocusAreaSeedInput(report.focusAreas) } },
  };
}

function buildSessionSeedInput(session: SessionSummary): Prisma.SessionCreateWithoutDriverInput {
  const startedAt = new Date(session.startedAt);
  const endedAt = new Date(startedAt.getTime() + session.lapCount * session.averageLapMs);
  const report = mockCoachingReports.find((candidate) => candidate.sessionId === session.id);
  const { className, carName } = parseCarLabel(session.carName);

  return {
    sim: SIM_NAME,
    sessionType: session.sessionType,
    sourceType: "manual",
    startedAt,
    endedAt,
    lapCount: session.lapCount,
    bestLapMs: session.bestLapMs,
    averageLapMs: session.averageLapMs,
    track: { create: buildTrackSeedInput(session.trackName) },
    car: { create: { sim: SIM_NAME, className, carName } },
    laps: { create: mockLaps[session.id].map((lap) => buildLapSeedInput(session, lap)) },
    coachingReports: report ? { create: [buildCoachingReportSeedInput(report)] } : undefined,
  };
}

// Single pure builder for the entire seed graph: one demo driver with all of
// mock-data.ts's sessions, laps, telemetry, and coaching reports nested
// underneath. No I/O here - prisma/seed.ts is the thin layer that actually
// writes this to the database.
export function buildDriverSeedInput(): Prisma.DriverCreateInput {
  return {
    displayName: "Demo Driver",
    preferredSims: [SIM_NAME],
    sessions: { create: mockSessions.map((session) => buildSessionSeedInput(session)) },
  };
}
