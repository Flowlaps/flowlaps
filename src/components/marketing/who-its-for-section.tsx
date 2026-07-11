import { SectionHeading } from "@/components/marketing/section-heading";

const audience = [
  "Drivers who want to improve without turning sim racing into homework.",
  "Drivers who don't know what 10m looks like in-game, and don't want to.",
  "Drivers who want one clear thing to work on, not a debrief with everything.",
];

export function WhoItsForSection() {
  return (
    <section className="bg-primary/5">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <SectionHeading eyebrow="Who it's for" title="For drivers who just want to get better." />
        <ul className="mt-8 flex flex-col gap-4 sm:max-w-2xl">
          {audience.map((line) => (
            <li key={line} className="flex gap-3 text-foreground/70">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
