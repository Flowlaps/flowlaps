import { z } from "zod";

export const importSessionMetadataSchema = z.object({
  sim: z.string().trim().min(1, "Sim is required."),
  trackName: z.string().trim().min(1, "Track is required."),
  carClassName: z.string().trim().min(1, "Car class is required."),
  carName: z.string().trim().min(1, "Car is required."),
  sessionType: z.enum(["practice", "qualifying", "race", "hotlap"], "Choose a session type."),
});

export type ImportSessionMetadataInput = z.infer<typeof importSessionMetadataSchema>;
