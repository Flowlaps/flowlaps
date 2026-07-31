import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    driver: {
      findFirst: vi.fn(),
    },
    session: {
      findMany: vi.fn(),
    },
    coachingReport: {
      findMany: vi.fn(),
    },
  },
}));

const mockedFindDriver = vi.mocked(prisma.driver.findFirst);
const mockedFindSessions = vi.mocked(prisma.session.findMany);
const mockedFindReports = vi.mocked(prisma.coachingReport.findMany);

beforeEach(() => {
  mockedFindDriver.mockReset();
  mockedFindSessions.mockReset();
  mockedFindReports.mockReset();
});

const now = new Date("2026-07-29T12:00:00.000Z");
const driver = { id: "driver-1", displayName: "Demo Driver" };

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

const report = {
  id: "report-1",
  sessionId: "session-1",
  summary: "You are braking too early overall in the heaviest braking zones.",
  paceNotes: null,
  brakingNotes: null,
  throttleNotes: null,
  consistencyNotes: null,
  nextPracticePlan: "Run 5 laps focused only on braking point at Les Combes",
  createdAt: now,
  focusAreas: [
    {
      id: "focus-1",
      reportId: "report-1",
      category: "braking",
      title: "Delay braking into Les Combes and Bus Stop",
      description: "Delay braking into Les Combes and Bus Stop",
      priority: 1,
      createdAt: now,
    },
  ],
};

describe("Dashboard Home", () => {
  it("renders sessions and coaching reports from Prisma for the default driver", async () => {
    mockedFindDriver.mockResolvedValue(driver as never);
    mockedFindSessions.mockResolvedValue([session] as never);
    mockedFindReports.mockResolvedValue([report] as never);

    render(await Home());

    expect(mockedFindSessions).toHaveBeenCalledWith({
      where: { driverId: "driver-1" },
      include: { track: true, car: true, laps: true },
      orderBy: { startedAt: "desc" },
    });
    expect(mockedFindReports).toHaveBeenCalledWith({
      where: { session: { driverId: "driver-1" } },
      include: { focusAreas: true },
      orderBy: { createdAt: "desc" },
    });
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getAllByText("Spa-Francorchamps").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/You are braking too early overall/),
    ).toBeInTheDocument();
  });

  it("shows the empty state when there's no default driver yet", async () => {
    mockedFindDriver.mockResolvedValue(null);

    render(await Home());

    expect(mockedFindSessions).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "No sessions yet." })).toBeInTheDocument();
  });

  it("shows the empty state when the driver has no sessions", async () => {
    mockedFindDriver.mockResolvedValue(driver as never);
    mockedFindSessions.mockResolvedValue([] as never);
    mockedFindReports.mockResolvedValue([] as never);

    render(await Home());

    expect(screen.getByRole("heading", { name: "No sessions yet." })).toBeInTheDocument();
  });
});
