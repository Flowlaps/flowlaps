import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { formatLapTime } from "@/lib/format";
import type { SessionSummary } from "@/types/session";

interface SessionKpisProps {
  session: SessionSummary;
  theoreticalBestMs?: number;
}

export function SessionKpis({ session, theoreticalBestMs }: SessionKpisProps) {
  const stats = [
    {
      label: "Best lap",
      value: formatLapTime(session.bestLapMs),
      description: "Fastest valid lap",
    },
    {
      label: "Average lap",
      value: formatLapTime(session.averageLapMs),
      description: `Across ${session.lapCount} laps`,
    },
    {
      label: "Consistency",
      value: `±${(session.consistencyDeltaMs / 1000).toFixed(1)}s`,
      description: "Gap between best and average",
    },
    {
      label: "Theoretical best",
      value: theoreticalBestMs !== undefined ? formatLapTime(theoreticalBestMs) : "—",
      description: "Best sector times combined",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent>
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold">{stat.value}</CardTitle>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
