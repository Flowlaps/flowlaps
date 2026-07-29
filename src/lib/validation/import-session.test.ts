import { describe, expect, it } from "vitest";
import { importSessionMetadataSchema } from "./import-session";

const validInput = {
  sim: "Assetto Corsa Competizione",
  trackName: "Spa-Francorchamps",
  carClassName: "GT3",
  carName: "Porsche 992",
  sessionType: "practice",
};

describe("importSessionMetadataSchema", () => {
  it("accepts well-formed metadata", () => {
    expect(importSessionMetadataSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a blank sim", () => {
    const result = importSessionMetadataSchema.safeParse({ ...validInput, sim: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects a session type outside the known set", () => {
    const result = importSessionMetadataSchema.safeParse({ ...validInput, sessionType: "endurance" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing car name", () => {
    const { sim, trackName, carClassName, sessionType } = validInput;
    const result = importSessionMetadataSchema.safeParse({ sim, trackName, carClassName, sessionType });
    expect(result.success).toBe(false);
  });
});
