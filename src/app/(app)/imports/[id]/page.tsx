import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mapSessionToSummary, mapLapsToSummaries } from "@/lib/import/map-session-for-view";
import { getTheoreticalBestSectors } from "@/lib/lap-analysis";
import { SessionHeader } from "@/components/session/session-header";
import { SessionKpis } from "@/components/session/session-kpis";
import { LapTable } from "@/components/session/lap-table";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

interface ImportResultPageProps {
  params: Promise<{ id: string }>;
}

const GENERIC_ERROR_MESSAGE = "This import couldn't be processed.";

function ImportFailedCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Import failed</h1>
        <p className="max-w-md text-muted-foreground">{message}</p>
        <Link href="/import" className={buttonVariants({ variant: "outline", className: "mt-2" })}>
          Try another file
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function ImportResultPage({ params }: ImportResultPageProps) {
  const { id } = await params;

  const importRecord = await prisma.import.findUnique({
    where: { id },
    include: { session: { include: { track: true, car: true, laps: true } } },
  });

  if (!importRecord) {
    notFound();
  }

  if (importRecord.status === "failed") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
        <ImportFailedCard message={importRecord.errorMessage ?? GENERIC_ERROR_MESSAGE} />
      </main>
    );
  }

  if (importRecord.status !== "parsed" || !importRecord.session) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
        <ImportFailedCard message={GENERIC_ERROR_MESSAGE} />
      </main>
    );
  }

  const session = mapSessionToSummary(importRecord.session);
  const laps = mapLapsToSummaries(importRecord.session.laps);
  const bestSectors = getTheoreticalBestSectors(laps);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <SessionHeader session={session} hideCompareLink />
      <SessionKpis session={session} theoreticalBestMs={bestSectors?.theoreticalBestMs} />
      <LapTable laps={laps} bestSectors={bestSectors} />
    </main>
  );
}
