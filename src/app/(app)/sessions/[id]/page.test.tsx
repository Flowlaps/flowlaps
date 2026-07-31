import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SessionPage from "./page";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
  },
}));

const mockedFindUnique = vi.mocked(prisma.session.findUnique);

beforeEach(() => {
  mockedFindUnique.mockReset();
});

const now = new Date("2026-07-29T12:00:00.000Z");

const session = {
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
};

describe("SessionPage", () => {
  it("renders the session from Prisma", async () => {
    mockedFindUnique.mockResolvedValue(session as never);

    render(await SessionPage({ params: Promise.resolve({ id: "session-1" }) }));

    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: "session-1" },
      include: { track: true, car: true, laps: true },
    });
    expect(screen.getByRole("heading", { name: "Spa-Francorchamps" })).toBeInTheDocument();
    expect(screen.getByText(/GT3 - Porsche 992/)).toBeInTheDocument();
  });

  it("shows the compare-laps link", async () => {
    mockedFindUnique.mockResolvedValue(session as never);

    render(await SessionPage({ params: Promise.resolve({ id: "session-1" }) }));

    expect(screen.getByText("Compare laps")).toBeInTheDocument();
  });

  it("throws notFound when the session doesn't exist", async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(SessionPage({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow();
  });
});
