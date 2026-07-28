"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; filename: string }
  | { status: "error"; message: string };

const NO_FILE_MESSAGE = "Choose a CSV file to import.";
const UNEXPECTED_ERROR_MESSAGE =
  "Something went wrong while uploading the file. Please try again.";

export function ImportUploadForm() {
  const fileInputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setState({ status: "error", message: NO_FILE_MESSAGE });
      return;
    }

    setState({ status: "uploading" });

    const formData = new FormData();
    formData.set("file", selectedFile);

    try {
      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData,
      });
      const body = await response.json();

      if (!response.ok) {
        setState({
          status: "error",
          message: body.error ?? UNEXPECTED_ERROR_MESSAGE,
        });
        return;
      }

      setState({ status: "success", filename: body.filename });
    } catch {
      setState({ status: "error", message: UNEXPECTED_ERROR_MESSAGE });
    }
  }

  if (state.status === "success") {
    return (
      <Card>
        <CardContent
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-1 py-6 text-center"
        >
          <p className="font-medium">{state.filename} was uploaded.</p>
          <p className="text-sm text-muted-foreground">
            We&apos;ll let you know once it&apos;s ready to view.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isUploading = state.status === "uploading";
  const hasError = state.status === "error";

  return (
    <Card>
      <CardContent className="py-2">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor={fileInputId} className="text-sm font-medium">
              Session CSV
            </label>
            <Input
              id={fileInputId}
              name="file"
              type="file"
              accept=".csv"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                if (hasError) setState({ status: "idle" });
              }}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${fileInputId}-error` : undefined}
              className="mt-2 h-10"
            />
            {hasError ? (
              <p
                id={`${fileInputId}-error`}
                role="alert"
                className="mt-2 text-sm text-destructive"
              >
                {state.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={isUploading}
            className="self-start"
          >
            {isUploading ? "Uploading…" : "Upload session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
