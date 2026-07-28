import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-2">
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    </main>
  );
}
