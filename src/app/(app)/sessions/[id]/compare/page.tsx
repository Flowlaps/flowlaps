import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { LapComparisonSelector } from "@/components/session/lap-comparison-selector";
import { LapComparisonCallouts } from "@/components/session/lap-comparison-callouts";
import { LapComparisonCharts } from "@/components/session/lap-comparison-charts";
import { mockSessions, mockLaps } from "@/lib/mock-data";
import { resolveLapComparison } from "@/lib/lap-analysis";
import { generateLapTelemetry } from "@/lib/mock-telemetry";
import { buildComparisonSeries, buildComparisonSummary } from "@/lib/lap-comparison";
import { formatLapTime } from "@/lib/format";

interface ComparePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lap?: string }>;
}

function BackToSessionLink({ sessionId }: { sessionId: string }) {
  return (
    <Link
      href={`/sessions/${sessionId}`}
      className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to session
    </Link>
  );
}

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
  const { id } = await params;
  const { lap: lapParam } = await searchParams;
  const session = mockSessions.find((item) => item.id === id);

  if (!session) {
    notFound();
  }

  const laps = mockLaps[session.id] ?? [];
  const comparison = resolveLapComparison(laps, lapParam);

  if (!comparison) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <BackToSessionLink sessionId={session.id} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-32 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Not enough laps to compare yet.</h1>
          <p className="max-w-md text-muted-foreground">
            Run at least two valid laps in a session to see a comparison here.
          </p>
          <Link href={`/sessions/${session.id}`} className={buttonVariants({ className: "mt-2" })}>
            Back to session
          </Link>
        </div>
      </main>
    );
  }

  const { bestLap, comparableLaps, selectedLap } = comparison;

  // Cheap against mock data generated in-memory; once this reads real
  // per-sample telemetry, generating both laps synchronously per request
  // will need caching/streaming instead.
  const bestTelemetry = generateLapTelemetry(session, bestLap);
  const selectedTelemetry = generateLapTelemetry(session, selectedLap);
  const series = buildComparisonSeries(bestTelemetry, selectedTelemetry);
  const summary = buildComparisonSummary(series, bestLap, selectedLap);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-4">
        <BackToSessionLink sessionId={session.id} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lap comparison</h1>
          <p className="text-muted-foreground">
            {session.trackName} · {session.carName}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Best lap: Lap {bestLap.lapNumber} — {formatLapTime(bestLap.lapTimeMs)}
        </p>
        <Suspense fallback={<div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />}>
          <LapComparisonSelector laps={comparableLaps} selectedLapId={selectedLap.id} />
        </Suspense>
      </div>

      <LapComparisonCallouts summary={summary} />
      <LapComparisonCharts series={series} selectedLapNumber={selectedLap.lapNumber} />
    </main>
  );
}
