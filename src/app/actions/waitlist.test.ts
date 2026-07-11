import { describe, expect, it, vi, beforeEach } from "vitest";
import { joinWaitlist } from "./waitlist";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    waitlist: {
      upsert: vi.fn(),
    },
  },
}));

const mockedUpsert = vi.mocked(prisma.waitlist.upsert);

beforeEach(() => {
  mockedUpsert.mockReset();
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

    consoleErrorSpy.mockRestore();
  });
});
