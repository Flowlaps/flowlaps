import { SectionHeading } from "@/components/marketing/section-heading";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

export function WaitlistSection() {
  return (
    <section id="waitlist" className="bg-primary/10 scroll-mt-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-24 text-center sm:py-32">
        <SectionHeading
          eyebrow="Get early access"
          title="Be first in when Flowlaps opens up."
          description="No spam, just a note when it's ready to try."
          align="center"
          descriptionClassName="text-foreground/70"
        />
        <div className="w-full max-w-md">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
