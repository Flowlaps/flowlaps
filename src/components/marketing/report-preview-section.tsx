import { SectionHeading } from "@/components/marketing/section-heading";
import { SessionReportCard } from "@/components/marketing/session-report-card";

export function ReportPreviewSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
      <SectionHeading
        eyebrow="What you get"
        title="One habit. One clear next step."
        description="No dashboards to dig through. Just the pattern that mattered most from your last session."
        align="center"
        className="mx-auto"
      />
      <div className="mt-10 flex flex-col items-center gap-3">
        <SessionReportCard />
        <p className="text-xs text-muted-foreground">
          Example report — not from a real session.
        </p>
      </div>
    </section>
  );
}
