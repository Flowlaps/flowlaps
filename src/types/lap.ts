export interface LapSummary {
  id: string;
  sessionId: string;
  lapNumber: number;
  lapTimeMs: number;
  isValid: boolean;
  sector1Ms: number;
  sector2Ms: number;
  sector3Ms: number;
}
