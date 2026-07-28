import type { TelemetryPoint } from "@/types/telemetry";
import type { LapSummary } from "@/types/lap";

export interface ComparisonPoint {
  distanceMeters: number;
  bestSpeedKph: number;
  selectedSpeedKph: number;
  bestBrakePct: number;
  selectedBrakePct: number;
  bestThrottlePct: number;
  selectedThrottlePct: number;
}

// Both telemetry series are sampled on the same fixed distance grid, so they
// can be zipped by index without needing to interpolate.
export function buildComparisonSeries(
  bestLapTelemetry: TelemetryPoint[],
  selectedLapTelemetry: TelemetryPoint[],
): ComparisonPoint[] {
  const length = Math.min(bestLapTelemetry.length, selectedLapTelemetry.length);
  const points: ComparisonPoint[] = [];

  for (let i = 0; i < length; i++) {
    const best = bestLapTelemetry[i];
    const selected = selectedLapTelemetry[i];
    points.push({
      distanceMeters: best.distanceMeters,
      bestSpeedKph: best.speedKph,
      selectedSpeedKph: selected.speedKph,
      bestBrakePct: best.brakePct,
      selectedBrakePct: selected.brakePct,
      bestThrottlePct: best.throttlePct,
      selectedThrottlePct: selected.throttlePct,
    });
  }

  return points;
}

export interface ComparisonCallout {
  id: string;
  sectorLabel: string;
  message: string;
  timeLostMs: number;
}

export interface ComparisonSummary {
  totalTimeLostMs: number;
  overallMessage: string;
  zoneCallouts: ComparisonCallout[];
}

const SECTOR_LABELS = ["Sector 1", "Sector 2", "Sector 3"];
const KPH_TO_MPS = 1000 / 3600;
const MIN_NOTABLE_TIME_LOST_MS = 15;
const MAX_ZONE_CALLOUTS = 3;

function segmentTimeMs(speedKphA: number, speedKphB: number, distanceStepM: number): number {
  const avgSpeedMps = ((speedKphA + speedKphB) / 2) * KPH_TO_MPS;
  if (avgSpeedMps <= 0) return 0;
  return (distanceStepM / avgSpeedMps) * 1000;
}

// Splits the lap into 3 broad distance sectors (not corner-by-corner) and
// estimates real time lost per sector via t = d/v, so callouts stay grounded
// in the data without pretending to know an exact braking point.
//
// Assumes both series share the same fixed distance grid mock-telemetry
// generates (constant SAMPLE_STEP_M): the `end - start < 2` guard just skips
// a sector with too few points to form a segment, which can't happen against
// today's dense, evenly-spaced mock samples. A real telemetry source with
// sparser or uneven sampling could hit that guard and silently drop a
// sector's callout — revisit this if/when this stops being fed exclusively
// by generateLapTelemetry.
export function buildComparisonSummary(
  series: ComparisonPoint[],
  bestLap: LapSummary,
  selectedLap: LapSummary,
): ComparisonSummary {
  const totalTimeLostMs = selectedLap.lapTimeMs - bestLap.lapTimeMs;
  const sectorSize = Math.ceil(series.length / SECTOR_LABELS.length);
  const zoneCallouts: ComparisonCallout[] = [];

  SECTOR_LABELS.forEach((sectorLabel, sector) => {
    const start = sector * sectorSize;
    const end = Math.min(series.length, start + sectorSize);
    if (end - start < 2) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `buildComparisonSummary: ${sectorLabel} has too few points (${end - start}) to form a segment — dropping its callout. This shouldn't happen against generateLapTelemetry's dense, fixed-step samples; check the telemetry source's sampling density if you're seeing this.`,
        );
      }
      return;
    }

    let bestTimeMs = 0;
    let selectedTimeMs = 0;
    for (let i = start; i < end - 1; i++) {
      const a = series[i];
      const b = series[i + 1];
      const distanceStepM = b.distanceMeters - a.distanceMeters;
      bestTimeMs += segmentTimeMs(a.bestSpeedKph, b.bestSpeedKph, distanceStepM);
      selectedTimeMs += segmentTimeMs(a.selectedSpeedKph, b.selectedSpeedKph, distanceStepM);
    }

    const timeLostMs = selectedTimeMs - bestTimeMs;
    if (timeLostMs < MIN_NOTABLE_TIME_LOST_MS) return;

    let brakeDeltaSum = 0;
    let throttleDeltaSum = 0;
    for (let i = start; i < end; i++) {
      brakeDeltaSum += series[i].selectedBrakePct - series[i].bestBrakePct;
      throttleDeltaSum += series[i].selectedThrottlePct - series[i].bestThrottlePct;
    }
    const pointCount = end - start;
    const avgBrakeDelta = brakeDeltaSum / pointCount;
    const avgThrottleDelta = throttleDeltaSum / pointCount;

    const message =
      avgBrakeDelta > 4
        ? `You're losing time under braking in ${sectorLabel}.`
        : avgThrottleDelta < -4
          ? `You're giving away exit speed out of ${sectorLabel}.`
          : `You're carrying less speed through ${sectorLabel}.`;

    zoneCallouts.push({ id: `sector-${sector + 1}`, sectorLabel, message, timeLostMs });
  });

  zoneCallouts.sort((a, b) => b.timeLostMs - a.timeLostMs);
  const topZones = zoneCallouts.slice(0, MAX_ZONE_CALLOUTS);

  const deltaSeconds = (Math.abs(totalTimeLostMs) / 1000).toFixed(3);
  const overallMessage =
    totalTimeLostMs <= 0
      ? "This lap matches or beats your best lap — nice and consistent."
      : topZones.length > 0
        ? `This lap is ${deltaSeconds}s slower than your best, mostly in ${topZones[0].sectorLabel}.`
        : `This lap is ${deltaSeconds}s slower than your best, spread fairly evenly rather than in one spot.`;

  return { totalTimeLostMs, overallMessage, zoneCallouts: topZones };
}
