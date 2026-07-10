import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/format";
import type { CoachingReportSummary } from "@/types/coaching-report";
import type { SessionSummary } from "@/types/session";

interface CoachingReportCardsProps {
  reports: CoachingReportSummary[];
  sessionsById: Map<string, SessionSummary>;
}

export function CoachingReportCards({
  reports,
  sessionsById,
}: CoachingReportCardsProps) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">
        Latest coaching reports
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((report) => {
          const session = sessionsById.get(report.sessionId);
          return (
            <Link key={report.id} href={`/sessions/${report.sessionId}/report`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">
                    {session?.trackName ?? "Session"}
                  </CardTitle>
                  <CardDescription>
                    {formatRelativeDate(report.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{report.summary}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.focusAreas.map((area, index) => (
                      <Badge key={`${report.id}-${index}`} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-medium">Next practice</p>
                    <ul className="mt-1 list-disc pl-4 text-sm text-muted-foreground">
                      {report.practicePlan.map((step, index) => (
                        <li key={`${report.id}-plan-${index}`}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
