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
