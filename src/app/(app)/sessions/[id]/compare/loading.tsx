import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 py-2">
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-52 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>

      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="py-2">
            <div className="h-56 w-full animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
