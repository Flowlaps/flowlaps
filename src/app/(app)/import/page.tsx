import { ImportUploadForm } from "@/components/import/import-upload-form";

export default function ImportPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Import a session
        </h1>
        <p className="text-muted-foreground">
          Upload a CSV export from your sim to add it to your dashboard.
        </p>
      </div>
      <ImportUploadForm />
    </main>
  );
}
