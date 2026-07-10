import { KpiSummary } from "@/components/dashboard/kpi-summary";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import { CoachingReportCards } from "@/components/dashboard/coaching-report-cards";
import { EmptyState } from "@/components/dashboard/empty-state";
import { mockSessions, mockCoachingReports } from "@/lib/mock-data";

export default function Home() {
  const sessions = mockSessions;
  const reports = [...mockCoachingReports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

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
