import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { LapComparisonSelector } from "@/components/session/lap-comparison-selector";
import { LapComparisonCallouts } from "@/components/session/lap-comparison-callouts";
import { LapComparisonCharts } from "@/components/session/lap-comparison-charts";
import { mockSessions, mockLaps } from "@/lib/mock-data";
import { getBestLap } from "@/lib/lap-analysis";
import { generateLapTelemetry } from "@/lib/mock-telemetry";
import { buildComparisonSeries, buildComparisonSummary } from "@/lib/lap-comparison";
import { formatLapTime } from "@/lib/format";

interface ComparePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lap?: string }>;
}

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
  const { id } = await params;
  const { lap: lapParam } = await searchParams;
  const session = mockSessions.find((item) => item.id === id);

  if (!session) {
    notFound();
  }

  const laps = mockLaps[session.id] ?? [];
  const bestLap = getBestLap(laps);
  const comparableLaps = laps.filter((lap) => lap.isValid && lap.id !== bestLap?.id);

  if (!bestLap || comparableLaps.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <Link
          href={`/sessions/${session.id}`}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to session
        </Link>
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

  const selectedLap =
    comparableLaps.find((lap) => lap.id === lapParam) ?? comparableLaps[0];

  const bestTelemetry = generateLapTelemetry(session, bestLap);
  const selectedTelemetry = generateLapTelemetry(session, selectedLap);
  const series = buildComparisonSeries(bestTelemetry, selectedTelemetry);
  const summary = buildComparisonSummary(series, bestLap, selectedLap);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-4">
        <Link
          href={`/sessions/${session.id}`}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to session
        </Link>
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
        <LapComparisonSelector laps={comparableLaps} selectedLapId={selectedLap.id} />
      </div>

      <LapComparisonCallouts summary={summary} />
      <LapComparisonCharts series={series} selectedLapNumber={selectedLap.lapNumber} />
    </main>
  );
}
