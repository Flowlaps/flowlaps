import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

interface ImportResultPageProps {
  params: Promise<{ id: string }>;
}

const GENERIC_ERROR_MESSAGE = "This import couldn't be processed.";

function ImportFailedCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Import failed</h1>
        <p className="max-w-md text-muted-foreground">{message}</p>
        <Link href="/import" className={buttonVariants({ variant: "outline", className: "mt-2" })}>
          Try another file
        </Link>
      </CardContent>
    </Card>
  );
}

// The upload form redirects straight to /sessions/[id] on success, so this
// route is normally only reached for a failed import (surfacing the parse
// error) or a stale/bookmarked link. A parsed import found here still sends
// the visitor on to the real session view rather than 404ing or re-rendering
// a second copy of it.
export default async function ImportResultPage({ params }: ImportResultPageProps) {
  const { id } = await params;

  const importRecord = await prisma.import.findUnique({
    where: { id },
    select: { status: true, errorMessage: true, sessionId: true },
  });

  if (!importRecord) {
    notFound();
  }

  if (importRecord.status === "parsed" && importRecord.sessionId) {
    redirect(`/sessions/${importRecord.sessionId}`);
  }

  const message =
    importRecord.status === "failed"
      ? (importRecord.errorMessage ?? GENERIC_ERROR_MESSAGE)
      : GENERIC_ERROR_MESSAGE;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
      <ImportFailedCard message={message} />
    </main>
  );
}
