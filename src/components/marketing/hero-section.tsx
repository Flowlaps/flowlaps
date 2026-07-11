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
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-primary/25"
      >
        <path
          d="M -50 380 C 150 380, 220 40, 400 40 S 650 380, 850 380"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="14 14"
        />
        <circle cx="400" cy="40" r="7" fill="currentColor" />
      </svg>

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
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
