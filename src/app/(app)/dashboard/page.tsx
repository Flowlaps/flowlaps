import { KpiSummary } from "@/components/dashboard/kpi-summary";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import { CoachingReportCards } from "@/components/dashboard/coaching-report-cards";
import { EmptyState } from "@/components/dashboard/empty-state";
import { prisma } from "@/lib/prisma";
import { getDefaultDriver } from "@/lib/default-driver";
import { mapSessionToSummary, mapCoachingReportToSummary } from "@/lib/session-mapping";

export default async function Home() {
  const driver = await getDefaultDriver(prisma);

  if (!driver) {
    return <EmptyState />;
  }

  const [sessionRecords, reportRecords] = await Promise.all([
    prisma.session.findMany({
      where: { driverId: driver.id },
      include: { track: true, car: true, laps: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.coachingReport.findMany({
      where: { session: { driverId: driver.id } },
      include: { focusAreas: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const sessions = sessionRecords.map(mapSessionToSummary);
  const reports = reportRecords.map(mapCoachingReportToSummary);

  if (sessions.length === 0) {
    return <EmptyState />;
  }

  const sessionsById = new Map(sessions.map((session) => [session.id, session]));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          See where you&apos;re gaining time and what to focus on next.
        </p>
      </div>

      <KpiSummary sessions={sessions} latestReport={reports[0]} />
      <RecentSessions sessions={sessions} />
      <CoachingReportCards reports={reports} sessionsById={sessionsById} />
    </main>
  );
}
