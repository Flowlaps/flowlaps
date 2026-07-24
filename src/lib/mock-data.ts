import type { SessionSummary } from "@/types/session";
import type { CoachingReportSummary } from "@/types/coaching-report";
import type { LapSummary } from "@/types/lap";

export const mockSessions: SessionSummary[] = [
  {
    id: "session-1",
    trackName: "Spa-Francorchamps",
    carName: "GT3 - Porsche 992",
    sessionType: "practice",
    startedAt: "2026-07-09T18:30:00.000Z",
    lapCount: 14,
    bestLapMs: 138_412,
    averageLapMs: 140_890,
    consistencyDeltaMs: 2_478,
  },
  {
    id: "session-2",
    trackName: "Silverstone GP",
    carName: "GT3 - BMW M4",
    sessionType: "hotlap",
    startedAt: "2026-07-08T20:05:00.000Z",
    lapCount: 8,
    bestLapMs: 116_207,
    averageLapMs: 117_984,
    consistencyDeltaMs: 1_777,
  },
  {
    id: "session-3",
    trackName: "Nürburgring GP",
    carName: "GT3 - Audi R8 LMS",
    sessionType: "race",
    startedAt: "2026-07-06T19:15:00.000Z",
    lapCount: 22,
    bestLapMs: 113_055,
    averageLapMs: 115_930,
    consistencyDeltaMs: 2_875,
  },
  {
    id: "session-4",
    trackName: "Monza",
    carName: "GT3 - Ferrari 296",
    sessionType: "qualifying",
    startedAt: "2026-07-03T21:00:00.000Z",
    lapCount: 6,
    bestLapMs: 108_642,
    averageLapMs: 109_501,
    consistencyDeltaMs: 859,
  },
];

export const mockCoachingReports: CoachingReportSummary[] = [
  {
    id: "report-1",
    sessionId: "session-1",
    createdAt: "2026-07-09T19:10:00.000Z",
    summary:
      "You are braking too early overall in the heaviest braking zones, giving away time on corner entry without gaining stability.",
    focusAreas: [
      "Delay braking into Les Combes and Bus Stop",
      "Smooth throttle pickup on exit of Pouhon",
    ],
    practicePlan: [
      "Run 5 laps focused only on braking point at Les Combes",
      "Note how each lap feels rather than chasing lap time",
    ],
  },
  {
    id: "report-2",
    sessionId: "session-2",
    createdAt: "2026-07-08T20:40:00.000Z",
    summary:
      "Your pace is strong but drops off after lap 5 as fatigue sets in, suggesting a confidence rather than a pace problem.",
    focusAreas: [
      "Hold consistent brake pressure through Copse",
      "Commit to throttle earlier at Stowe exit",
    ],
    practicePlan: [
      "Do a short run of 6 to 8 laps and stop before fatigue sets in",
      "Compare your first 3 laps against your last 3 for pace drop-off",
    ],
  },
  {
    id: "report-3",
    sessionId: "session-3",
    createdAt: "2026-07-06T20:05:00.000Z",
    summary:
      "You are giving away exit speed by waiting too long to commit to throttle out of the slower corners on this lap.",
    focusAreas: [
      "Commit to throttle earlier out of the Castrol S",
      "Trust front grip through the Karussell",
      "Stay consistent across the final sector",
    ],
    practicePlan: [
      "Pick one slow corner and work only on throttle timing there",
      "Run a few laps focused purely on a consistent final sector",
    ],
  },
];

// A small seeded PRNG so generated lap data is deterministic across renders
// and test runs, instead of drifting every time this module is imported.
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Generates believable per-lap sector splits for a session: one lap hits the
// session's recorded bestLapMs exactly, the first lap is an invalid out lap
// (skipped when there's only one lap), and every other lap lands somewhere
// between the best and average lap time. Sector times always sum exactly to
// the lap time, so downstream consumers never have to reconcile a rounding
// gap between the two.
function buildLapsForSession(session: SessionSummary): LapSummary[] {
  const random = mulberry32(hashString(session.id));
  const spreadMs = session.averageLapMs - session.bestLapMs;
  const bestLapIndex =
    session.lapCount <= 1
      ? 0
      : Math.min(session.lapCount - 1, Math.max(1, Math.round(session.lapCount * 0.35)));

  return Array.from({ length: session.lapCount }, (_, index) => {
    const lapNumber = index + 1;
    const isBestLap = index === bestLapIndex;
    const isOutLap = index === 0 && session.lapCount > 1;

    const lapTimeMs = isBestLap
      ? session.bestLapMs
      : isOutLap
        ? Math.round(session.averageLapMs + spreadMs * 1.5)
        : Math.round(session.bestLapMs + spreadMs * 0.3 + random() * spreadMs);

    const sector1Ms = Math.round(lapTimeMs * (0.33 + (random() - 0.5) * 0.03));
    const sector2Ms = Math.round(lapTimeMs * (0.33 + (random() - 0.5) * 0.03));
    const sector3Ms = lapTimeMs - sector1Ms - sector2Ms;

    return {
      id: `${session.id}-lap-${lapNumber}`,
      sessionId: session.id,
      lapNumber,
      lapTimeMs,
      isValid: !isOutLap,
      sector1Ms,
      sector2Ms,
      sector3Ms,
    };
  });
}

export const mockLaps: Record<string, LapSummary[]> = Object.fromEntries(
  mockSessions.map((session) => [session.id, buildLapsForSession(session)]),
);
