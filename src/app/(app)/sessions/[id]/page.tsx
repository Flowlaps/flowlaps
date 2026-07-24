import { notFound } from "next/navigation";
import { SessionHeader } from "@/components/session/session-header";
import { SessionKpis } from "@/components/session/session-kpis";
import { LapTable } from "@/components/session/lap-table";
import { mockSessions, mockLaps } from "@/lib/mock-data";
import { getTheoreticalBestSectors } from "@/lib/lap-analysis";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const session = mockSessions.find((item) => item.id === id);

  if (!session) {
    notFound();
  }

  const laps = mockLaps[session.id] ?? [];
  const bestSectors = getTheoreticalBestSectors(laps);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <SessionHeader session={session} />
      <SessionKpis session={session} theoreticalBestMs={bestSectors?.theoreticalBestMs} />
      <LapTable laps={laps} bestSectors={bestSectors} />
    </main>
  );
}
