"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sessionTypeLabels } from "@/lib/format";
import type { SessionType } from "@/types/session";

type UploadState = { status: "idle" } | { status: "uploading" } | { status: "error"; message: string };

const NO_FILE_MESSAGE = "Choose a CSV file to import.";
const MISSING_METADATA_MESSAGE = "Fill in the session details before uploading.";
const UNEXPECTED_ERROR_MESSAGE =
  "Something went wrong while uploading the file. Please try again.";

const SESSION_TYPES: SessionType[] = ["practice", "qualifying", "race", "hotlap"];

export function ImportUploadForm() {
  const router = useRouter();
  const fileInputId = useId();
  const simId = useId();
  const trackNameId = useId();
  const carClassNameId = useId();
  const carNameId = useId();
  const sessionTypeId = useId();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sim, setSim] = useState("");
  const [trackName, setTrackName] = useState("");
  const [carClassName, setCarClassName] = useState("");
  const [carName, setCarName] = useState("");
  const [sessionType, setSessionType] = useState<SessionType | "">("");
  const [state, setState] = useState<UploadState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setState({ status: "error", message: NO_FILE_MESSAGE });
      return;
    }

    if (!sim.trim() || !trackName.trim() || !carClassName.trim() || !carName.trim() || !sessionType) {
      setState({ status: "error", message: MISSING_METADATA_MESSAGE });
      return;
    }

    setState({ status: "uploading" });

    const formData = new FormData();
    formData.set("file", selectedFile);
    formData.set("sim", sim);
    formData.set("trackName", trackName);
    formData.set("carClassName", carClassName);
    formData.set("carName", carName);
    formData.set("sessionType", sessionType);

    try {
      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData,
      });
      const body = await response.json();

      if (!response.ok) {
        setState({ status: "error", message: body.error ?? UNEXPECTED_ERROR_MESSAGE });
        return;
      }

      router.push(`/imports/${body.importId}`);
    } catch (error) {
      console.error("ImportUploadForm: failed to upload file", error);
      setState({ status: "error", message: UNEXPECTED_ERROR_MESSAGE });
    }
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
              className="mt-2 h-10"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Exported from SimHub&apos;s Logging feature. Required columns: Gear, Throttle, Brake,
              Rpms, SpeedKmh, CurrentLap, CompletedLaps, CurrentLapTime, LastLapTime,
              Sector1LastLapTime, Sector2LastLapTime, Sector3LastLapTime, SessionOdo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={simId} className="text-sm font-medium">
                Sim
              </label>
              <Input
                id={simId}
                value={sim}
                onChange={(event) => setSim(event.target.value)}
                placeholder="Assetto Corsa Competizione"
                className="mt-2 h-10"
              />
            </div>
            <div>
              <label htmlFor={trackNameId} className="text-sm font-medium">
                Track
              </label>
              <Input
                id={trackNameId}
                value={trackName}
                onChange={(event) => setTrackName(event.target.value)}
                placeholder="Spa-Francorchamps"
                className="mt-2 h-10"
              />
            </div>
            <div>
              <label htmlFor={carClassNameId} className="text-sm font-medium">
                Car class
              </label>
              <Input
                id={carClassNameId}
                value={carClassName}
                onChange={(event) => setCarClassName(event.target.value)}
                placeholder="GT3"
                className="mt-2 h-10"
              />
            </div>
            <div>
              <label htmlFor={carNameId} className="text-sm font-medium">
                Car
              </label>
              <Input
                id={carNameId}
                value={carName}
                onChange={(event) => setCarName(event.target.value)}
                placeholder="Porsche 992"
                className="mt-2 h-10"
              />
            </div>
            <div>
              <label htmlFor={sessionTypeId} className="text-sm font-medium">
                Session type
              </label>
              <Select
                value={sessionType}
                onValueChange={(value) => setSessionType(value ?? "")}
              >
                <SelectTrigger id={sessionTypeId} className="mt-2 w-full">
                  <SelectValue placeholder="Choose a session type" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {sessionTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasError ? (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={isUploading} className="self-start">
            {isUploading ? "Uploading…" : "Upload session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
