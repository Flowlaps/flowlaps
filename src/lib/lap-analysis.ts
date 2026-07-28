import type { LapSummary } from "@/types/lap";

export interface TheoreticalBestSectors {
  sector1Ms: number;
  sector2Ms: number;
  sector3Ms: number;
  theoreticalBestMs: number;
}

export function getBestLap(laps: LapSummary[]): LapSummary | undefined {
  return laps
    .filter((lap) => lap.isValid)
    .reduce<LapSummary | undefined>(
      (best, lap) => (!best || lap.lapTimeMs < best.lapTimeMs ? lap : best),
      undefined,
    );
}

export function getTheoreticalBestSectors(
  laps: LapSummary[],
): TheoreticalBestSectors | undefined {
  const validLaps = laps.filter((lap) => lap.isValid);
  if (validLaps.length === 0) return undefined;

  const sector1Ms = Math.min(...validLaps.map((lap) => lap.sector1Ms));
  const sector2Ms = Math.min(...validLaps.map((lap) => lap.sector2Ms));
  const sector3Ms = Math.min(...validLaps.map((lap) => lap.sector3Ms));

  return {
    sector1Ms,
    sector2Ms,
    sector3Ms,
    theoreticalBestMs: sector1Ms + sector2Ms + sector3Ms,
  };
}

export interface LapComparisonSelection {
  bestLap: LapSummary;
  comparableLaps: LapSummary[];
  selectedLap: LapSummary;
}

// Resolves which laps a comparison view should show: the session's best lap,
// every other valid lap it can be compared against, and which of those is
// selected (falling back to the first when the requested id isn't valid).
// Returns undefined when there isn't at least one lap on each side to compare.
export function resolveLapComparison(
  laps: LapSummary[],
  selectedLapId: string | undefined,
): LapComparisonSelection | undefined {
  const bestLap = getBestLap(laps);
  if (!bestLap) return undefined;

  const comparableLaps = laps.filter((lap) => lap.isValid && lap.id !== bestLap.id);
  if (comparableLaps.length === 0) return undefined;

  const selectedLap =
    comparableLaps.find((lap) => lap.id === selectedLapId) ?? comparableLaps[0];

  return { bestLap, comparableLaps, selectedLap };
}
