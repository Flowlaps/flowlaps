export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-3 px-6 py-32">
      <h1 className="text-2xl font-semibold tracking-tight">
        Your dashboard will live here.
      </h1>
      <p className="max-w-md text-muted-foreground">
        Import a session to see your recent laps, consistency, and coaching
        reports in one calm view.
      </p>
    </main>
  );
}
