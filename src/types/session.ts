export type SessionType = "practice" | "qualifying" | "race" | "hotlap";

export interface SessionSummary {
  id: string;
  trackName: string;
  carName: string;
  sessionType: SessionType;
  startedAt: string;
  lapCount: number;
  bestLapMs: number;
  averageLapMs: number;
  consistencyDeltaMs: number;
}
