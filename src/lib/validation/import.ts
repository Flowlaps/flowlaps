import { z } from "zod";

export const MAX_IMPORT_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const CSV_EXTENSION_PATTERN = /\.csv$/i;

export const importUploadSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1, "File must have a name.")
    .regex(CSV_EXTENSION_PATTERN, "Only .csv files are supported."),
  fileSizeBytes: z
    .number()
    .int()
    .positive("File is empty.")
    .max(
      MAX_IMPORT_FILE_SIZE_BYTES,
      `File is larger than the ${MAX_IMPORT_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.`,
    ),
  rawContent: z
    .string()
    .trim()
    .min(1, "File has no content.")
    .refine(
      (content) => content.split(/\r\n|\r|\n/, 2)[0]?.includes(","),
      "File does not look like a CSV (no comma-separated header row found).",
    ),
});

export type ImportUploadInput = z.infer<typeof importUploadSchema>;
