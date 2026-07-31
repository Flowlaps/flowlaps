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

describe("ImportResultPage", () => {
  it("redirects to the session detail page for a parsed import", async () => {
    mockedFindUnique.mockResolvedValue({
      status: "parsed",
      errorMessage: null,
      sessionId: "session-1",
    } as never);

    await expect(
      ImportResultPage({ params: Promise.resolve({ id: "import-1" }) }),
    ).rejects.toThrow();

    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: "import-1" },
      select: { status: true, errorMessage: true, sessionId: true },
    });
  });

  it("shows the failure message for a failed import", async () => {
    mockedFindUnique.mockResolvedValue({
      status: "failed",
      errorMessage: "CSV is missing required columns: Gear",
      sessionId: null,
    } as never);

    render(await ImportResultPage({ params: Promise.resolve({ id: "import-1" }) }));

    expect(screen.getByRole("heading", { name: "Import failed" })).toBeInTheDocument();
    expect(screen.getByText("CSV is missing required columns: Gear")).toBeInTheDocument();
  });

  it("falls back to a generic message when a failed import has no errorMessage", async () => {
    mockedFindUnique.mockResolvedValue({
      status: "failed",
      errorMessage: null,
      sessionId: null,
    } as never);

    render(await ImportResultPage({ params: Promise.resolve({ id: "import-1" }) }));

    expect(screen.getByText("This import couldn't be processed.")).toBeInTheDocument();
  });

  it("shows a generic message for an uploaded-but-not-yet-parsed import", async () => {
    mockedFindUnique.mockResolvedValue({
      status: "uploaded",
      errorMessage: null,
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
