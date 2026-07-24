import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatLapTime } from "@/lib/format";
import { getBestLap } from "@/lib/lap-analysis";
import type { LapSummary } from "@/types/lap";
import type { TheoreticalBestSectors } from "@/lib/lap-analysis";

interface LapTableProps {
  laps: LapSummary[];
  bestSectors?: TheoreticalBestSectors;
}

function formatSector(ms: number): string {
  return (ms / 1000).toFixed(3);
}

export function LapTable({ laps, bestSectors }: LapTableProps) {
  const bestLap = getBestLap(laps);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lap breakdown</CardTitle>
        <CardDescription>
          {bestSectors
            ? `Theoretical best lap: ${formatLapTime(bestSectors.theoreticalBestMs)}, combining your best sector times`
            : "No valid laps yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-120 border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Lap</th>
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="py-2 pr-3 font-medium">Sector 1</th>
                <th className="py-2 pr-3 font-medium">Sector 2</th>
                <th className="py-2 font-medium">Sector 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {laps.map((lap) => (
                <tr
                  key={lap.id}
                  className={cn(
                    !lap.isValid && "text-muted-foreground",
                    lap.id === bestLap?.id && "bg-primary/5",
                  )}
                >
                  <td className="py-2 pr-3">
                    {lap.lapNumber}
                    {!lap.isValid && (
                      <span className="ml-1.5 text-xs">Out lap</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "py-2 pr-3 font-medium",
                      lap.id === bestLap?.id && "text-primary",
                    )}
                  >
                    {formatLapTime(lap.lapTimeMs)}
                  </td>
                  <td
                    className={cn(
                      "py-2 pr-3",
                      bestSectors &&
                        lap.sector1Ms === bestSectors.sector1Ms &&
                        "font-medium text-primary",
                    )}
                  >
                    {formatSector(lap.sector1Ms)}
                  </td>
                  <td
                    className={cn(
                      "py-2 pr-3",
                      bestSectors &&
                        lap.sector2Ms === bestSectors.sector2Ms &&
                        "font-medium text-primary",
                    )}
                  >
                    {formatSector(lap.sector2Ms)}
                  </td>
                  <td
                    className={cn(
                      "py-2",
                      bestSectors &&
                        lap.sector3Ms === bestSectors.sector3Ms &&
                        "font-medium text-primary",
                    )}
                  >
                    {formatSector(lap.sector3Ms)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
