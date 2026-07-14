import { describe, expect, it, vi, beforeEach } from "vitest";
import { joinWaitlist } from "./waitlist";
import { prisma } from "@/lib/prisma";
import { track } from "@vercel/analytics/server";
import { WAITLIST_SIGNUP_EVENT } from "@/lib/analytics";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    waitlist: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@vercel/analytics/server", () => ({
  track: vi.fn().mockResolvedValue(undefined),
}));

const mockedUpsert = vi.mocked(prisma.waitlist.upsert);
const mockedTrack = vi.mocked(track);

beforeEach(() => {
  mockedUpsert.mockReset();
  mockedTrack.mockReset();
  mockedTrack.mockResolvedValue(undefined);
});

function formDataWith(email: string | undefined) {
  const formData = new FormData();
  if (email !== undefined) {
    formData.set("email", email);
  }
  return formData;
}

describe("joinWaitlist", () => {
  it("rejects an invalid email without touching the database", async () => {
    const result = await joinWaitlist(
      { status: "idle" },
      formDataWith("not-an-email"),
    );

    expect(result).toEqual({
      status: "error",
      message: "Please enter a valid email address.",
      email: "not-an-email",
    });
    expect(mockedUpsert).not.toHaveBeenCalled();
    expect(mockedTrack).not.toHaveBeenCalled();
  });

  it("rejects a missing email field", async () => {
    const result = await joinWaitlist({ status: "idle" }, formDataWith(undefined));

    expect(result.status).toBe("error");
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it("normalizes the email (trim + lowercase) before upserting", async () => {
    mockedUpsert.mockResolvedValue({
      id: "row-1",
      email: "driver@example.com",
      createdAt: new Date(),
    });

    const result = await joinWaitlist(
      { status: "idle" },
      formDataWith("  Driver@Example.com  "),
    );

    expect(mockedUpsert).toHaveBeenCalledWith({
      where: { email: "driver@example.com" },
      create: { email: "driver@example.com" },
      update: {},
    });
    expect(result).toEqual({ status: "success" });
    expect(mockedTrack).toHaveBeenCalledWith(
      WAITLIST_SIGNUP_EVENT,
      undefined,
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("returns success for a duplicate email, indistinguishable from a new signup", async () => {
    // The upsert's `update: {}` is what makes a duplicate a no-op at the DB
    // level; nothing in the returned state should reveal whether the email
    // already existed.
    mockedUpsert.mockResolvedValue({
      id: "row-1",
      email: "driver@example.com",
      createdAt: new Date(),
    });

    const result = await joinWaitlist(
      { status: "idle" },
      formDataWith("driver@example.com"),
    );

    expect(result).toEqual({ status: "success" });
    expect(mockedTrack).toHaveBeenCalledTimes(1);
  });

  it("maps an unexpected database error to a calm generic message and logs it", async () => {
    mockedUpsert.mockRejectedValue(new Error("connection refused"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await joinWaitlist(
      { status: "idle" },
      formDataWith("driver@example.com"),
    );

    expect(result).toEqual({
      status: "error",
      message: "Something went wrong. Please try again.",
      email: "driver@example.com",
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockedTrack).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
