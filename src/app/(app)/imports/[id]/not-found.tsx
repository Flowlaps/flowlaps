import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ImportNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-32 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Import not found.</h1>
      <p className="max-w-md text-muted-foreground">
        This import may have been removed, or the link might be out of date.
      </p>
      <Link href="/import" className={buttonVariants({ className: "mt-2" })}>
        Import a session
      </Link>
    </div>
  );
}
