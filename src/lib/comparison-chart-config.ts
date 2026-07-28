import type { ComparisonPoint } from "@/lib/lap-comparison";

export interface ChartSpec {
  title: string;
  description: string;
  bestKey: keyof ComparisonPoint;
  selectedKey: keyof ComparisonPoint;
  formatValue: (value: unknown) => string;
  domain?: [number, number];
}

// A stable per-unit formatter, built once at module load rather than inline
// in JSX, so recharts gets the same function reference across renders.
function createValueFormatter(unit: string) {
  return (value: unknown) => `${Math.round(Number(value))} ${unit}`;
}

export function formatDistance(value: unknown): string {
  return `${Math.round(Number(value))}m`;
}

// Kept in a plain module (no "use client") so loading.tsx — a Server
// Component — can read CHARTS.length without importing it across the client
// boundary from lap-comparison-charts.tsx, which needs "use client" for the
// recharts JSX it renders.
export const CHARTS: ChartSpec[] = [
  {
    title: "Speed",
    description: "Speed through the lap",
    bestKey: "bestSpeedKph",
    selectedKey: "selectedSpeedKph",
    formatValue: createValueFormatter("kph"),
  },
  {
    title: "Brake",
    description: "Brake input through the lap",
    bestKey: "bestBrakePct",
    selectedKey: "selectedBrakePct",
    formatValue: createValueFormatter("%"),
    domain: [0, 100],
  },
  {
    title: "Throttle",
    description: "Throttle input through the lap",
    bestKey: "bestThrottlePct",
    selectedKey: "selectedThrottlePct",
    formatValue: createValueFormatter("%"),
    domain: [0, 100],
  },
];

export const COMPARISON_CHART_COUNT = CHARTS.length;
