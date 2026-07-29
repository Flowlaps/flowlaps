// @vitest-environment node
//
// This suite exercises a server-only Route Handler. Running it under the
// project's default jsdom environment would swap in jsdom's `File`, which
// undici's FormData parsing inside NextRequest doesn't recognize as the same
// brand as its own `File` - so the request body would fail to parse.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    import: {
      create: vi.fn(),
      update: vi.fn(),
    },
    driver: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  },
}));

const mockedImportCreate = vi.mocked(prisma.import.create);
const mockedImportUpdate = vi.mocked(prisma.import.update);
const mockedDriverFindFirst = vi.mocked(prisma.driver.findFirst);
const mockedSessionCreate = vi.mocked(prisma.session.create);

beforeEach(() => {
  mockedImportCreate.mockReset();
  mockedImportUpdate.mockReset();
  mockedDriverFindFirst.mockReset();
  mockedSessionCreate.mockReset();
});

function requestWithForm(fields: { file?: File | null; [key: string]: unknown }) {
  const formData = new FormData();
  const { file, ...rest } = fields;
  if (file) {
    formData.set("file", file);
  }
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) {
      formData.set(key, String(value));
    }
  }
  return new NextRequest("http://localhost/api/imports", {
    method: "POST",
    body: formData,
  });
}

const validMetadata = {
  sim: "Assetto Corsa Competizione",
  trackName: "Spa-Francorchamps",
  carClassName: "GT3",
  carName: "Porsche 992",
  sessionType: "practice",
};

const SIMHUB_HEADER =
  "Gear,Throttle,Brake,Rpms,SpeedKmh,CurrentLap,CompletedLaps,CurrentLapTime,LastLapTime,Sector1LastLapTime,Sector2LastLapTime,Sector3LastLapTime,SessionOdo";

const validSimHubCsv = [
  SIMHUB_HEADER,
  "3,100,0,6500,180,1,0,0:00.000,0:00.000,0:00.000,0:00.000,0:00.000,0",
  "3,100,0,6500,180,1,0,0:01.000,0:00.000,0:00.000,0:00.000,0:00.000,50",
  "3,100,0,6500,180,2,1,0:00.000,1:30.500,0:30.100,0:30.200,0:30.200,150",
].join("\n");

const unparseableCsv = "lapNumber,timestampMs,speedKph\n1,0,120\n";

describe("POST /api/imports", () => {
  it("rejects a request with no file", async () => {
    const response = await POST(requestWithForm({ file: null, ...validMetadata }));

    expect(response.status).toBe(400);
    expect(mockedImportCreate).not.toHaveBeenCalled();
  });

  it("rejects a non-CSV file without touching the database", async () => {
    const file = new File(["not a csv"], "notes.txt", { type: "text/plain" });
    const response = await POST(requestWithForm({ file, ...validMetadata }));

    expect(response.status).toBe(400);
    expect(mockedImportCreate).not.toHaveBeenCalled();
  });

  it("rejects content that doesn't look like CSV", async () => {
    const file = new File(["just some text"], "session.csv", { type: "text/csv" });
    const response = await POST(requestWithForm({ file, ...validMetadata }));

    expect(response.status).toBe(400);
    expect(mockedImportCreate).not.toHaveBeenCalled();
  });

  it("rejects a request with missing session details without touching the database", async () => {
    const file = new File([validSimHubCsv], "session.csv", { type: "text/csv" });
    const response = await POST(requestWithForm({ file, ...validMetadata, trackName: "" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Track is required.");
    expect(mockedImportCreate).not.toHaveBeenCalled();
  });

  it("normalizes a valid CSV, creates a session, and marks the import parsed", async () => {
    const createdAt = new Date("2026-07-29T12:00:00.000Z");
    mockedImportCreate.mockResolvedValue({
      id: "import-1",
      filename: "session.csv",
      fileSizeBytes: validSimHubCsv.length,
      rawContent: validSimHubCsv,
      status: "uploaded",
      errorMessage: null,
      createdAt,
      sessionId: null,
    });
    mockedDriverFindFirst.mockResolvedValue({
      id: "driver-1",
      displayName: "Demo Driver",
      preferredSims: [],
      coachingStyle: null,
      createdAt,
      updatedAt: createdAt,
    });
    mockedSessionCreate.mockResolvedValue({ id: "session-1" } as never);
    mockedImportUpdate.mockResolvedValue({} as never);

    const file = new File([validSimHubCsv], "session.csv", { type: "text/csv" });
    const response = await POST(requestWithForm({ file, ...validMetadata }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      importId: "import-1",
      sessionId: "session-1",
      filename: "session.csv",
      rowErrorCount: 0,
    });
    expect(mockedSessionCreate).toHaveBeenCalledTimes(1);
    expect(mockedImportUpdate).toHaveBeenCalledWith({
      where: { id: "import-1" },
      data: { status: "parsed", sessionId: "session-1" },
    });
  });

  it("marks the import failed and returns the parse error when the CSV can't be normalized", async () => {
    const createdAt = new Date("2026-07-29T12:00:00.000Z");
    mockedImportCreate.mockResolvedValue({
      id: "import-2",
      filename: "session.csv",
      fileSizeBytes: unparseableCsv.length,
      rawContent: unparseableCsv,
      status: "uploaded",
      errorMessage: null,
      createdAt,
      sessionId: null,
    });
    mockedImportUpdate.mockResolvedValue({} as never);

    const file = new File([unparseableCsv], "session.csv", { type: "text/csv" });
    const response = await POST(requestWithForm({ file, ...validMetadata }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/missing required columns/i);
    expect(body.importId).toBe("import-2");
    expect(mockedImportUpdate).toHaveBeenCalledWith({
      where: { id: "import-2" },
      data: { status: "failed", errorMessage: expect.stringMatching(/missing required columns/i) },
    });
    expect(mockedSessionCreate).not.toHaveBeenCalled();
  });

  it("maps an unexpected database error during import creation to a generic message and logs it", async () => {
    mockedImportCreate.mockRejectedValue(new Error("connection refused"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const file = new File([validSimHubCsv], "session.csv", { type: "text/csv" });
    const response = await POST(requestWithForm({ file, ...validMetadata }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/went wrong/i);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("marks the import failed when session creation fails unexpectedly", async () => {
    const createdAt = new Date("2026-07-29T12:00:00.000Z");
    mockedImportCreate.mockResolvedValue({
      id: "import-3",
      filename: "session.csv",
      fileSizeBytes: validSimHubCsv.length,
      rawContent: validSimHubCsv,
      status: "uploaded",
      errorMessage: null,
      createdAt,
      sessionId: null,
    });
    mockedDriverFindFirst.mockResolvedValue({
      id: "driver-1",
      displayName: "Demo Driver",
      preferredSims: [],
      coachingStyle: null,
      createdAt,
      updatedAt: createdAt,
    });
    mockedSessionCreate.mockRejectedValue(new Error("constraint violation"));
    mockedImportUpdate.mockResolvedValue({} as never);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const file = new File([validSimHubCsv], "session.csv", { type: "text/csv" });
    const response = await POST(requestWithForm({ file, ...validMetadata }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.importId).toBe("import-3");
    expect(mockedImportUpdate).toHaveBeenCalledWith({
      where: { id: "import-3" },
      data: { status: "failed", errorMessage: expect.stringMatching(/went wrong/i) },
    });

    consoleErrorSpy.mockRestore();
  });
});
