import { describe, expect, it } from "vitest";
import { importUploadSchema, MAX_IMPORT_FILE_SIZE_BYTES } from "./import";

const validInput = {
  filename: "session-2026-07-28.csv",
  fileSizeBytes: 1024,
  rawContent: "lapNumber,timestampMs,speedKph\n1,0,120\n",
};

describe("importUploadSchema", () => {
  it("accepts a well-formed CSV upload", () => {
    const result = importUploadSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a filename without a .csv extension", () => {
    const result = importUploadSchema.safeParse({
      ...validInput,
      filename: "session-2026-07-28.txt",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty file", () => {
    const result = importUploadSchema.safeParse({
      ...validInput,
      fileSizeBytes: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file over the size limit", () => {
    const result = importUploadSchema.safeParse({
      ...validInput,
      fileSizeBytes: MAX_IMPORT_FILE_SIZE_BYTES + 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects content with no comma-separated header row", () => {
    const result = importUploadSchema.safeParse({
      ...validInput,
      rawContent: "this is not a csv file",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = importUploadSchema.safeParse({
      ...validInput,
      rawContent: "   ",
    });
    expect(result.success).toBe(false);
  });
});
