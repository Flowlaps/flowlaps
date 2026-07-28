export interface TelemetryPoint {
  lapId: string;
  distanceMeters: number;
  speedKph: number;
  throttlePct: number;
  brakePct: number;
}
