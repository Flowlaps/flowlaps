import { SectionHeading } from "@/components/marketing/section-heading";

const steps = [
  {
    step: "01",
    title: "Import your session",
    description: "Drop in your session data when you're done driving.",
  },
  {
    step: "02",
    title: "Get a plain-language report",
    description:
      "We turn it into a short, calm summary of what changed and why.",
  },
  {
    step: "03",
    title: "Practice one habit",
    description: "One clear focus for your next session. Nothing else.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <SectionHeading eyebrow="How it works" title="Three steps. After every session." />
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="flex flex-col gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {item.step}
              </span>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
