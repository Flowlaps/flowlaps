import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatLapTime, formatRelativeDate, sessionTypeLabels } from "@/lib/format";
import type { SessionSummary } from "@/types/session";

interface RecentSessionsProps {
  sessions: SessionSummary[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent sessions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        {sessions.map((session, index) => (
          <div key={session.id}>
            {index > 0 && <Separator className="my-3" />}
            <Link
              href={`/sessions/${session.id}`}
              className="flex flex-col justify-between gap-2 rounded-md py-1 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:px-2"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{session.trackName}</span>
                  <Badge variant="secondary">{sessionTypeLabels[session.sessionType]}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {session.carName} · {formatRelativeDate(session.startedAt)}
                </span>
              </div>
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <span className="text-sm font-medium">
                  {formatLapTime(session.bestLapMs)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session.lapCount} laps
                </span>
              </div>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
