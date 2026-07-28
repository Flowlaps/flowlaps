import { describe, expect, it } from "vitest";
import { hashString, mulberry32 } from "./seeded-random";

describe("mulberry32", () => {
  it("produces the same sequence for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("diverges for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("stays within [0, 1)", () => {
    const random = mulberry32(hashString("Spa-Francorchamps"));
    for (let i = 0; i < 200; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("works with a negative seed (e.g. from hashString's signed overflow)", () => {
    const random = mulberry32(-12345);
    const value = random();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
});

describe("hashString", () => {
  it("is stable for the same string", () => {
    expect(hashString("session-1")).toBe(hashString("session-1"));
  });

  it("varies across different strings", () => {
    expect(hashString("session-1")).not.toBe(hashString("session-2"));
  });

  it("returns 0 for an empty string", () => {
    expect(hashString("")).toBe(0);
  });
});
