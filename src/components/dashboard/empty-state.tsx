import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-32 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        No sessions yet.
      </h1>
      <p className="max-w-md text-muted-foreground">
        Import a session to see your recent laps, consistency, and coaching
        reports in one calm view.
      </p>
      <Button
        className="mt-2"
        render={<Link href="/import">Import a session</Link>}
      />
    </div>
  );
}
