import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatRelativeDate, sessionTypeLabels } from "@/lib/format";
import type { SessionSummary } from "@/types/session";

interface SessionHeaderProps {
  session: SessionSummary;
}

export function SessionHeader({ session }: SessionHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{session.trackName}</h1>
            <Badge variant="secondary">{sessionTypeLabels[session.sessionType]}</Badge>
          </div>
          <p className="text-muted-foreground">
            {session.carName} · {formatRelativeDate(session.startedAt)}
          </p>
        </div>
        <Link
          href={`/sessions/${session.id}/compare`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Compare laps
        </Link>
      </div>
    </div>
  );
}
