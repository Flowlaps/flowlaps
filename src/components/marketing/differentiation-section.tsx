import { SectionHeading } from "@/components/marketing/section-heading";

const principles = [
  {
    title: "Calm, not constant",
    description: "One short report after you drive. Nothing during it.",
  },
  {
    title: "Plain language",
    description: "Patterns you can picture, not numbers you have to decode.",
  },
  {
    title: "One habit at a time",
    description:
      "A single focus for next session, not a list of everything you did wrong.",
  },
];

export function DifferentiationSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-16">
      <SectionHeading
        eyebrow="Why Flowlaps"
        title="Built to feel like a coach, not a parser."
        align="center"
        className="mx-auto"
      />
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {principles.map((principle) => (
          <div
            key={principle.title}
            className="flex flex-col gap-2 rounded-xl border border-primary/15 p-6"
          >
            <h3 className="font-medium">{principle.title}</h3>
            <p className="text-sm text-muted-foreground">
              {principle.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
