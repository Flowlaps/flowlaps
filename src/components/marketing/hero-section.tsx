import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 flex justify-center"
      >
        <div className="h-72 w-xl rounded-full bg-primary/20 blur-3xl" />
      </div>

      <svg
        aria-hidden
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-primary/10"
      >
        <path
          d="M -50 320 C 90 300, 150 130, 300 95 C 420 68, 470 150, 610 165 C 710 175, 780 130, 900 85"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="300" cy="95" r="3" fill="currentColor" />
      </svg>

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-28 text-center sm:py-36">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Stay in the flow.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          The quiet AI coach for sim racers. No telemetry spreadsheets. No AI
          yelling in your ear.
        </p>
        <p className="max-w-xl text-lg text-muted-foreground">
          Just drive, and get one clear, actionable habit to fix after your
          session.
        </p>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="#waitlist" className={buttonVariants({ size: "lg" })}>
            Join the waitlist
          </Link>
          <Link
            href="#how-it-works"
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}
