import type { SessionSummary } from "@/types/session";
import type { LapSummary } from "@/types/lap";
import type { TelemetryPoint } from "@/types/telemetry";
import { hashString, mulberry32 } from "@/lib/seeded-random";

const LAP_DISTANCE_M = 4200;
const SAMPLE_STEP_M = 25;
const CORNER_COUNT = 6;

interface CornerProfile {
  positionM: number;
  minSpeedKph: number;
  brakingZoneM: number;
  exitZoneM: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(t: number): number {
  const clamped = clamp(t, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

// Same physical corner layout for every lap of a given track, so laps within
// a session (and across sessions on the same track) are directly comparable.
function buildTrackLayout(trackName: string): { topSpeedKph: number; corners: CornerProfile[] } {
  const random = mulberry32(hashString(trackName));
  const topSpeedKph = 250 + random() * 50;

  const corners: CornerProfile[] = Array.from({ length: CORNER_COUNT }, (_, index) => {
    const base = ((index + 1) / (CORNER_COUNT + 1)) * LAP_DISTANCE_M;
    const jitter = (random() - 0.5) * 200;
    const positionM = clamp(base + jitter, 150, LAP_DISTANCE_M - 150);
    const severity = random();
    const minSpeedKph = 60 + (1 - severity) * 130;
    const brakingZoneM = 70 + severity * 90;

    return { positionM, minSpeedKph, brakingZoneM, exitZoneM: brakingZoneM * 0.8 };
  });

  return { topSpeedKph, corners: corners.sort((a, b) => a.positionM - b.positionM) };
}

// Concentrates a slower lap's time loss into one or two corners (later brake
// point, lower apex speed, slower exit) instead of spreading noise evenly
// across the whole lap, so the resulting chart shows a believable, localized
// pattern rather than uniform randomness.
function applyLapVariance(
  corners: CornerProfile[],
  lap: LapSummary,
  sessionBestLapMs: number,
): CornerProfile[] {
  const random = mulberry32(hashString(lap.id));
  const paceSeconds = Math.max(0, lap.lapTimeMs - sessionBestLapMs) / 1000;

  const affectedCount = paceSeconds === 0 ? 0 : random() < 0.5 ? 1 : 2;
  const affectedIndices = new Set<number>();
  while (affectedIndices.size < affectedCount) {
    affectedIndices.add(Math.floor(random() * corners.length));
  }

  return corners.map((corner, index) => {
    const jitterKph = (random() - 0.5) * 4;

    if (!affectedIndices.has(index)) {
      return { ...corner, minSpeedKph: corner.minSpeedKph + jitterKph };
    }

    const severityFactor = 0.6 + random() * 0.8;
    const minSpeedPenalty = Math.min(28, paceSeconds * (3 + random() * 3)) * severityFactor;
    const brakingZoneBonus = Math.min(60, paceSeconds * (8 + random() * 6)) * severityFactor;

    return {
      positionM: corner.positionM,
      minSpeedKph: Math.max(40, corner.minSpeedKph - minSpeedPenalty + jitterKph),
      brakingZoneM: corner.brakingZoneM + brakingZoneBonus,
      exitZoneM: corner.exitZoneM + brakingZoneBonus * 0.6,
    };
  });
}

function sampleAt(
  distanceMeters: number,
  corners: CornerProfile[],
  topSpeedKph: number,
): { speedKph: number; brakePct: number; throttlePct: number } {
  let speedKph = topSpeedKph;
  let brakePct = 0;
  let throttlePct = 100;

  for (const corner of corners) {
    const distFromApex = distanceMeters - corner.positionM;

    if (distFromApex < 0 && distFromApex >= -corner.brakingZoneM) {
      const eased = smoothstep((distFromApex + corner.brakingZoneM) / corner.brakingZoneM);
      const localSpeed = topSpeedKph - (topSpeedKph - corner.minSpeedKph) * eased;
      if (localSpeed < speedKph) {
        speedKph = localSpeed;
        brakePct = eased * 100;
        throttlePct = 0;
      }
    } else if (distFromApex >= 0 && distFromApex <= corner.exitZoneM) {
      const eased = smoothstep(distFromApex / corner.exitZoneM);
      const localSpeed = corner.minSpeedKph + (topSpeedKph - corner.minSpeedKph) * eased;
      if (localSpeed < speedKph) {
        speedKph = localSpeed;
        throttlePct = eased * 100;
        brakePct = 0;
      }
    }
  }

  return { speedKph, brakePct, throttlePct };
}

// Deterministic: the same session + lap always produces the same telemetry,
// so charts don't shift between renders or test runs.
export function generateLapTelemetry(session: SessionSummary, lap: LapSummary): TelemetryPoint[] {
  const layout = buildTrackLayout(session.trackName);
  const corners = applyLapVariance(layout.corners, lap, session.bestLapMs);

  const points: TelemetryPoint[] = [];
  for (let distanceMeters = 0; distanceMeters <= LAP_DISTANCE_M; distanceMeters += SAMPLE_STEP_M) {
    const { speedKph, brakePct, throttlePct } = sampleAt(distanceMeters, corners, layout.topSpeedKph);
    points.push({
      lapId: lap.id,
      distanceMeters,
      speedKph: Math.round(speedKph * 10) / 10,
      brakePct: Math.round(clamp(brakePct, 0, 100)),
      throttlePct: Math.round(clamp(throttlePct, 0, 100)),
    });
  }

  return points;
}
