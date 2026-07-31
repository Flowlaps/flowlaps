import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ImportResultPage from "./page";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    import: {
      findUnique: vi.fn(),
    },
  },
}));

const mockedFindUnique = vi.mocked(prisma.import.findUnique);

beforeEach(() => {
  mockedFindUnique.mockReset();
});

const now = new Date("2026-07-29T12:00:00.000Z");

const parsedImport = {
  id: "import-1",
  filename: "session.csv",
  fileSizeBytes: 1024,
  rawContent: "...",
  status: "parsed" as const,
  errorMessage: null,
  createdAt: now,
  sessionId: "session-1",
  session: {
    id: "session-1",
    driverId: "driver-1",
    trackId: "track-1",
    carId: "car-1",
    sim: "Assetto Corsa Competizione",
    sessionType: "practice" as const,
    sourceType: "csv" as const,
    sourceFilename: "session.csv",
    startedAt: now,
    endedAt: now,
    lapCount: 1,
    bestLapMs: 90_500,
    averageLapMs: 90_500,
    createdAt: now,
    updatedAt: now,
    track: { id: "track-1", name: "Spa-Francorchamps", layout: null, countryCode: null, createdAt: now, updatedAt: now },
    car: { id: "car-1", sim: "Assetto Corsa Competizione", className: "GT3", carName: "Porsche 992", createdAt: now, updatedAt: now },
    laps: [
      {
        id: "lap-1",
        sessionId: "session-1",
        lapNumber: 1,
        lapTimeMs: 90_500,
        isValid: true,
        sector1Ms: 30_100,
        sector2Ms: 30_200,
        sector3Ms: 30_200,
        createdAt: now,
      },
    ],
  },
};

describe("ImportResultPage", () => {
  it("renders the normalized session for a parsed import", async () => {
    mockedFindUnique.mockResolvedValue(parsedImport as never);

    render(await ImportResultPage({ params: Promise.resolve({ id: "import-1" }) }));

    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: "import-1" },
      include: { session: { include: { track: true, car: true, laps: true } } },
    });
    expect(screen.getByRole("heading", { name: "Spa-Francorchamps" })).toBeInTheDocument();
    expect(screen.getByText(/GT3 - Porsche 992/)).toBeInTheDocument();
    expect(screen.queryByText("Compare laps")).not.toBeInTheDocument();
  });

  it("shows the failure message for a failed import", async () => {
    mockedFindUnique.mockResolvedValue({
      ...parsedImport,
      status: "failed",
      errorMessage: "CSV is missing required columns: Gear",
      session: null,
      sessionId: null,
    } as never);

    render(await ImportResultPage({ params: Promise.resolve({ id: "import-1" }) }));

    expect(screen.getByRole("heading", { name: "Import failed" })).toBeInTheDocument();
    expect(screen.getByText("CSV is missing required columns: Gear")).toBeInTheDocument();
  });

  it("falls back to a generic message when a failed import has no errorMessage", async () => {
    mockedFindUnique.mockResolvedValue({
      ...parsedImport,
      status: "failed",
      errorMessage: null,
      session: null,
      sessionId: null,
    } as never);

    render(await ImportResultPage({ params: Promise.resolve({ id: "import-1" }) }));

    expect(screen.getByText("This import couldn't be processed.")).toBeInTheDocument();
  });

  it("throws notFound when the import doesn't exist", async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(ImportResultPage({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow();
  });
});
