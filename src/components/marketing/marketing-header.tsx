import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Flowlaps
        </Link>
        <Link href="#waitlist" className={buttonVariants({ size: "sm" })}>
          Join the waitlist
        </Link>
      </div>
    </header>
  );
}
