import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComparisonSummary } from "@/lib/lap-comparison";

interface LapComparisonCalloutsProps {
  summary: ComparisonSummary;
}

export function LapComparisonCallouts({ summary }: LapComparisonCalloutsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What&apos;s different</CardTitle>
        <CardDescription>{summary.overallMessage}</CardDescription>
      </CardHeader>
      {summary.zoneCallouts.length > 0 && (
        <CardContent>
          <ul className="flex flex-col gap-2">
            {summary.zoneCallouts.map((callout) => (
              <li key={callout.id} className="text-sm text-muted-foreground">
                {callout.message}
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
