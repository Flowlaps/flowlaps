import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mapSessionToSummary, mapLapsToSummaries } from "@/lib/session-mapping";
import { SessionHeader } from "@/components/session/session-header";
import { SessionKpis } from "@/components/session/session-kpis";
import { LapTable } from "@/components/session/lap-table";
import { getTheoreticalBestSectors } from "@/lib/lap-analysis";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;

  const record = await prisma.session.findUnique({
    where: { id },
    include: { track: true, car: true, laps: true },
  });

  if (!record) {
    notFound();
  }

  const session = mapSessionToSummary(record);
  const laps = mapLapsToSummaries(record.laps);
  const bestSectors = getTheoreticalBestSectors(laps);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      {/* Lap comparison still only reads mock data (Ticket 8 wires it up
          next), so every session hides the link rather than pointing at a
          route that can't find a real session by id yet. */}
      <SessionHeader session={session} hideCompareLink />
      <SessionKpis session={session} theoreticalBestMs={bestSectors?.theoreticalBestMs} />
      <LapTable laps={laps} bestSectors={bestSectors} />
    </main>
  );
}
