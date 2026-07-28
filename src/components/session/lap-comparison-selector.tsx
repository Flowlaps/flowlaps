"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatLapTime } from "@/lib/format";
import type { LapSummary } from "@/types/lap";

interface LapComparisonSelectorProps {
  laps: LapSummary[];
  selectedLapId: string;
}

export function LapComparisonSelector({ laps, selectedLapId }: LapComparisonSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="compare-lap" className="text-sm text-muted-foreground">
        Compare against
      </label>
      <select
        id="compare-lap"
        value={selectedLapId}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams);
          params.set("lap", event.target.value);
          router.replace(`${pathname}?${params.toString()}`);
        }}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {laps.map((lap) => (
          <option key={lap.id} value={lap.id}>
            Lap {lap.lapNumber} — {formatLapTime(lap.lapTimeMs)}
          </option>
        ))}
      </select>
    </div>
  );
}
