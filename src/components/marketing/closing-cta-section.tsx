import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeading } from "@/components/marketing/section-heading";

export function ClosingCtaSection() {
  return (
    <section className="border-t border-border bg-primary/10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-24 text-center sm:py-32">
        <SectionHeading
          title="Drive. Get one clear thing to work on. Repeat."
          description="That's the whole idea. Join the waitlist to be first in."
          align="center"
          descriptionClassName="text-foreground/70"
        />
        <Link
          href="#waitlist"
          className={buttonVariants({ size: "lg", className: "mt-2" })}
        >
          Join the waitlist
        </Link>
      </div>
    </section>
  );
}
