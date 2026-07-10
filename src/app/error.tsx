"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-32 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong.
      </h1>
      <p className="max-w-md text-muted-foreground">
        We couldn&apos;t load your dashboard. Give it another try.
      </p>
      <Button className="mt-2" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
