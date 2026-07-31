import { Card, CardContent } from "@/components/ui/card";

// This route now only ever renders the narrow ImportFailedCard (a parsed
// import redirects straight on to /sessions/[id] instead), so the skeleton
// matches that layout rather than the full session-detail view.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10">
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-9 w-36 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    </main>
  );
}
