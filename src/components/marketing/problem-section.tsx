import { SectionHeading } from "@/components/marketing/section-heading";

const problems = [
  {
    title: "Too much data, not enough answer",
    description:
      "Telemetry overlays hand you a wall of graphs and expect you to find the signal yourself.",
  },
  {
    title: "Coaching that talks over the corner",
    description:
      "Live voice coaching adds noise exactly when you need to concentrate the most.",
  },
  {
    title: "Precision you can't use",
    description:
      "“Brake 12% later at 100m” means nothing if you don't know what 100m looks like.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-primary/5">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <SectionHeading
          title="Most coaching tools weren't built for after the session."
          className="max-w-2xl"
        />
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {problems.map((problem) => (
            <div key={problem.title} className="flex flex-col gap-2">
              <h3 className="font-medium">{problem.title}</h3>
              <p className="text-sm text-foreground/70">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
