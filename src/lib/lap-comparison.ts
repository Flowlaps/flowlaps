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

// Matches mock-telemetry.ts's own fixed sample spacing (not imported from
// there - this module shouldn't depend on the mock generator, they just
// happen to agree). Resampling a mock lap onto a grid at this same step is a
// no-op (every grid distance lands exactly on one of the lap's own samples,
// so interpolation collapses to t=0), which is what lap-comparison.test.ts's
// regression case checks.
const DISTANCE_GRID_STEP_M = 25;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

// Builds the shared distance grid two laps get resampled onto: 0 up to
// maxDistanceMeters (the shorter of the two laps' own last sample, decided by
// the caller) at a fixed step, always including the exact endpoint even if it
// doesn't land evenly on the step.
function buildDistanceGrid(maxDistanceMeters: number, stepMeters: number): number[] {
  if (maxDistanceMeters <= 0) return [0];

  const grid: number[] = [];
  for (let distance = 0; distance < maxDistanceMeters; distance += stepMeters) {
    grid.push(distance);
  }
  grid.push(maxDistanceMeters);
  return grid;
}

// Real per-lap telemetry (CSV import) is sampled at whatever time interval
// the source logged at, so distanceMeters between samples varies with speed
// and two different laps land on entirely different distances - unlike mock
// data's fixed step, they can't be zipped by array index. This resamples one
// lap's points onto an arbitrary shared distance grid via linear
// interpolation between the two real samples bracketing each grid distance,
// so any two laps (real or mock) end up on directly comparable series.
//
// Assumes points are already sorted ascending by distanceMeters (guaranteed
// by querying/generating in sampleIndex order - a lap's distance only
// increases over time) and that grid values fall within
// [points[0].distanceMeters, points[last].distanceMeters]; buildComparisonSeries
// guarantees the latter by building the grid from the two laps' own ranges.
export function resampleToDistanceGrid(
  points: TelemetryPoint[],
  grid: number[],
): TelemetryPoint[] {
  if (points.length === 0) return [];

  const lapId = points[0].lapId;
  let cursor = 0;

  return grid.map((distanceMeters) => {
    while (cursor < points.length - 2 && points[cursor + 1].distanceMeters <= distanceMeters) {
      cursor++;
    }

    const a = points[cursor];
    const b = points[Math.min(cursor + 1, points.length - 1)];
    const span = b.distanceMeters - a.distanceMeters;
    const t = span > 0 ? clamp01((distanceMeters - a.distanceMeters) / span) : 0;

    return {
      lapId,
      distanceMeters,
      speedKph: lerp(a.speedKph, b.speedKph, t),
      brakePct: lerp(a.brakePct, b.brakePct, t),
      throttlePct: lerp(a.throttlePct, b.throttlePct, t),
    };
  });
}

export function buildComparisonSeries(
  bestLapTelemetry: TelemetryPoint[],
  selectedLapTelemetry: TelemetryPoint[],
): ComparisonPoint[] {
  if (bestLapTelemetry.length === 0 || selectedLapTelemetry.length === 0) {
    return [];
  }

  const maxDistanceMeters = Math.min(
    bestLapTelemetry[bestLapTelemetry.length - 1].distanceMeters,
    selectedLapTelemetry[selectedLapTelemetry.length - 1].distanceMeters,
  );

  const grid = buildDistanceGrid(maxDistanceMeters, DISTANCE_GRID_STEP_M);
  const best = resampleToDistanceGrid(bestLapTelemetry, grid);
  const selected = resampleToDistanceGrid(selectedLapTelemetry, grid);

  return grid.map((distanceMeters, index) => ({
    distanceMeters,
    bestSpeedKph: best[index].speedKph,
    selectedSpeedKph: selected[index].speedKph,
    bestBrakePct: best[index].brakePct,
    selectedBrakePct: selected[index].brakePct,
    bestThrottlePct: best[index].throttlePct,
    selectedThrottlePct: selected[index].throttlePct,
  }));
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
// series is always evenly spaced on DISTANCE_GRID_STEP_M by this point -
// buildComparisonSeries resamples both laps onto the same grid regardless of
// how either was originally sampled, so the `end - start < 2` guard below is
// just a defensive floor for a very short comparison range, not something
// that depends on the telemetry source.
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
