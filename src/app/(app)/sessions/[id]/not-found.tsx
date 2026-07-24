import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function SessionNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-32 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Session not found.</h1>
      <p className="max-w-md text-muted-foreground">
        This session may have been removed, or the link might be out of date.
      </p>
      <Link href="/dashboard" className={buttonVariants({ className: "mt-2" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
