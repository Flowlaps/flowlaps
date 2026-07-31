import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { LapComparisonSelector } from "@/components/session/lap-comparison-selector";
import { LapComparisonCallouts } from "@/components/session/lap-comparison-callouts";
import { LapComparisonCharts } from "@/components/session/lap-comparison-charts";
import { prisma } from "@/lib/prisma";
import { mapSessionToSummary, mapLapsToSummaries } from "@/lib/session-mapping";
import { resolveLapComparison } from "@/lib/lap-analysis";
import { buildComparisonSeries, buildComparisonSummary } from "@/lib/lap-comparison";
import { formatLapTime } from "@/lib/format";
import type { TelemetryPoint } from "@/types/telemetry";

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

// Only the two laps actually being compared need their per-sample telemetry
// pulled - a session can have far more laps than that, so this stays scoped
// to one lapId at a time rather than fetching every lap's samples up front.
async function fetchLapTelemetry(lapId: string): Promise<TelemetryPoint[]> {
  const points = await prisma.telemetryPoint.findMany({
    where: { lapId },
    orderBy: { sampleIndex: "asc" },
  });

  return points.map((point) => ({
    lapId: point.lapId,
    distanceMeters: point.distanceMeters,
    speedKph: point.speedKph,
    throttlePct: point.throttlePct,
    brakePct: point.brakePct,
  }));
}

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
  const { id } = await params;
  const { lap: lapParam } = await searchParams;

  const record = await prisma.session.findUnique({
    where: { id },
    include: { track: true, car: true, laps: true },
  });

  if (!record) {
    notFound();
  }

  const session = mapSessionToSummary(record);
  const laps = mapLapsToSummaries(record.laps);
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

  const [bestTelemetry, selectedTelemetry] = await Promise.all([
    fetchLapTelemetry(bestLap.id),
    fetchLapTelemetry(selectedLap.id),
  ]);
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
