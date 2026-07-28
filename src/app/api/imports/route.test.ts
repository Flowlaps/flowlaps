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
    },
  },
}));

const mockedCreate = vi.mocked(prisma.import.create);

beforeEach(() => {
  mockedCreate.mockReset();
});

function requestWithFile(file: File | null) {
  const formData = new FormData();
  if (file) {
    formData.set("file", file);
  }
  return new NextRequest("http://localhost/api/imports", {
    method: "POST",
    body: formData,
  });
}

const validCsv = "lapNumber,timestampMs,speedKph\n1,0,120\n";

describe("POST /api/imports", () => {
  it("rejects a request with no file", async () => {
    const response = await POST(requestWithFile(null));

    expect(response.status).toBe(400);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects a non-CSV file without touching the database", async () => {
    const file = new File(["not a csv"], "notes.txt", { type: "text/plain" });
    const response = await POST(requestWithFile(file));

    expect(response.status).toBe(400);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects content that doesn't look like CSV", async () => {
    const file = new File(["just some text"], "session.csv", {
      type: "text/csv",
    });
    const response = await POST(requestWithFile(file));

    expect(response.status).toBe(400);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("stores metadata for a valid CSV upload", async () => {
    const createdAt = new Date("2026-07-28T12:00:00.000Z");
    mockedCreate.mockResolvedValue({
      id: "import-1",
      filename: "session.csv",
      fileSizeBytes: validCsv.length,
      rawContent: validCsv,
      status: "uploaded",
      errorMessage: null,
      createdAt,
    });

    const file = new File([validCsv], "session.csv", { type: "text/csv" });
    const response = await POST(requestWithFile(file));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        filename: "session.csv",
        fileSizeBytes: validCsv.length,
        rawContent: validCsv.trim(),
        status: "uploaded",
      },
    });
    expect(body).toEqual({
      id: "import-1",
      filename: "session.csv",
      fileSizeBytes: validCsv.length,
      status: "uploaded",
      createdAt: createdAt.toISOString(),
    });
  });

  it("maps an unexpected database error to a generic message and logs it", async () => {
    mockedCreate.mockRejectedValue(new Error("connection refused"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const file = new File([validCsv], "session.csv", { type: "text/csv" });
    const response = await POST(requestWithFile(file));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/went wrong/i);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
