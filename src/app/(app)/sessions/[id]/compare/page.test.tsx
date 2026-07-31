import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ComparePage from "./page";
import { prisma } from "@/lib/prisma";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push, replace }),
    usePathname: () => "/sessions/session-full/compare",
    useSearchParams: () => new URLSearchParams(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
    telemetryPoint: {
      findMany: vi.fn(),
    },
  },
}));

const mockedFindSession = vi.mocked(prisma.session.findUnique);
const mockedFindTelemetry = vi.mocked(prisma.telemetryPoint.findMany);

beforeEach(() => {
  mockedFindSession.mockReset();
  mockedFindTelemetry.mockReset();
  mockedFindTelemetry.mockResolvedValue([
    { lapId: "lap-1", sampleIndex: 0, timestampMs: 0, distanceMeters: 0, speedKph: 80, throttlePct: 100, brakePct: 0, steeringAngleDeg: 0, gear: 3, rpm: 5000, createdAt: now },
    { lapId: "lap-1", sampleIndex: 1, timestampMs: 1000, distanceMeters: 40, speedKph: 120, throttlePct: 100, brakePct: 0, steeringAngleDeg: 0, gear: 4, rpm: 6000, createdAt: now },
  ] as never);
});

const now = new Date("2026-07-29T12:00:00.000Z");

const track = { id: "track-1", name: "Test Track", layout: null, countryCode: null, createdAt: now, updatedAt: now };
const car = { id: "car-1", sim: "Test Sim", className: "GT3", carName: "Test Car", createdAt: now, updatedAt: now };

function buildLapRecord(overrides: Record<string, unknown>) {
  return {
    id: "lap-1",
    sessionId: "session-full",
    lapNumber: 1,
    lapTimeMs: 100_000,
    isValid: true,
    sector1Ms: 33_000,
    sector2Ms: 33_000,
    sector3Ms: 34_000,
    createdAt: now,
    ...overrides,
  };
}

const sessionFullRecord = {
  id: "session-full",
  driverId: "driver-1",
  trackId: "track-1",
  carId: "car-1",
  sim: "Test Sim",
  sessionType: "practice" as const,
  sourceType: "csv" as const,
  sourceFilename: "session.csv",
  startedAt: now,
  endedAt: now,
  lapCount: 3,
  bestLapMs: 100_000,
  averageLapMs: 102_000,
  createdAt: now,
  updatedAt: now,
  track,
  car,
  laps: [
    buildLapRecord({ id: "session-full-lap-1", lapNumber: 1, lapTimeMs: 100_000 }),
    buildLapRecord({ id: "session-full-lap-2", lapNumber: 2, lapTimeMs: 102_000 }),
    buildLapRecord({ id: "session-full-lap-3", lapNumber: 3, lapTimeMs: 103_000 }),
  ],
};

const sessionEmptyRecord = {
  ...sessionFullRecord,
  id: "session-empty",
  lapCount: 1,
  laps: [buildLapRecord({ id: "session-empty-lap-1", sessionId: "session-empty", lapNumber: 1, lapTimeMs: 100_000 })],
};

describe("ComparePage", () => {
  it("throws (triggering the not-found boundary) when the session id doesn't exist", async () => {
    mockedFindSession.mockResolvedValue(null);

    await expect(
      ComparePage({
        params: Promise.resolve({ id: "does-not-exist" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow();
  });

  it("shows the calm empty state when a session doesn't have a second valid lap to compare", async () => {
    mockedFindSession.mockResolvedValue(sessionEmptyRecord as never);

    const jsx = await ComparePage({
      params: Promise.resolve({ id: "session-empty" }),
      searchParams: Promise.resolve({}),
    });
    render(jsx);

    expect(screen.getByText("Not enough laps to compare yet.")).toBeInTheDocument();
    expect(screen.queryByText("Lap comparison")).not.toBeInTheDocument();
    expect(mockedFindTelemetry).not.toHaveBeenCalled();
  });

  it("renders the comparison against the first comparable lap by default", async () => {
    mockedFindSession.mockResolvedValue(sessionFullRecord as never);

    const jsx = await ComparePage({
      params: Promise.resolve({ id: "session-full" }),
      searchParams: Promise.resolve({}),
    });
    render(jsx);

    expect(screen.getByText("Lap comparison")).toBeInTheDocument();
    expect(screen.getByText(/Best lap: Lap 1/)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("session-full-lap-2");
    expect(mockedFindTelemetry).toHaveBeenCalledWith({
      where: { lapId: "session-full-lap-1" },
      orderBy: { sampleIndex: "asc" },
    });
    expect(mockedFindTelemetry).toHaveBeenCalledWith({
      where: { lapId: "session-full-lap-2" },
      orderBy: { sampleIndex: "asc" },
    });
  });

  it("renders the comparison against the lap requested via the lap search param", async () => {
    mockedFindSession.mockResolvedValue(sessionFullRecord as never);

    const jsx = await ComparePage({
      params: Promise.resolve({ id: "session-full" }),
      searchParams: Promise.resolve({ lap: "session-full-lap-3" }),
    });
    render(jsx);

    expect(screen.getByRole("combobox")).toHaveValue("session-full-lap-3");
  });
});
