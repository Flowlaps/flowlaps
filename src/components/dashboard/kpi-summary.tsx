import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { formatLapTime } from "@/lib/format";
import type { SessionSummary } from "@/types/session";
import type { CoachingReportSummary } from "@/types/coaching-report";

interface KpiSummaryProps {
  sessions: SessionSummary[];
  latestReport?: CoachingReportSummary;
}

export function KpiSummary({ sessions, latestReport }: KpiSummaryProps) {
  const bestSession = sessions.reduce(
    (best, session) => (session.bestLapMs < best.bestLapMs ? session : best),
    sessions[0],
  );
  const avgConsistencyMs =
    sessions.reduce((sum, session) => sum + session.consistencyDeltaMs, 0) /
    sessions.length;

  const stats = [
    {
      label: "Sessions logged",
      value: sessions.length.toString(),
      description: "In your recent history",
    },
    {
      label: "Fastest lap",
      value: formatLapTime(bestSession.bestLapMs),
      description: `Outright, at ${bestSession.trackName}`,
    },
    {
      label: "Avg. consistency",
      value: `±${(avgConsistencyMs / 1000).toFixed(1)}s`,
      description: "Gap between best and average lap",
    },
    {
      label: "Focus areas",
      value: (latestReport?.focusAreas.length ?? 0).toString(),
      description: "From your latest coaching report",
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
