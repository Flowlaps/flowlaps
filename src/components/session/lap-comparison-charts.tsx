"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComparisonPoint } from "@/lib/lap-comparison";

interface LapComparisonChartsProps {
  series: ComparisonPoint[];
  selectedLapNumber: number;
}

interface ChartSpec {
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

function formatDistance(value: unknown): string {
  return `${Math.round(Number(value))}m`;
}

const CHARTS: ChartSpec[] = [
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

// Exported so loading.tsx's skeleton can render the same number of chart
// placeholders without duplicating (and drifting from) this count.
export const COMPARISON_CHART_COUNT = CHARTS.length;

export function LapComparisonCharts({ series, selectedLapNumber }: LapComparisonChartsProps) {
  return (
    <div className="flex flex-col gap-4">
      {CHARTS.map((chart) => (
        <Card key={chart.title}>
          <CardHeader>
            <CardTitle>{chart.title}</CardTitle>
            <CardDescription>{chart.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="h-56 w-full"
              role="img"
              aria-label={`${chart.title} comparison: best lap versus lap ${selectedLapNumber}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="distanceMeters"
                    tickFormatter={formatDistance}
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis domain={chart.domain} stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    formatter={chart.formatValue}
                    labelFormatter={formatDistance}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.75rem",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                  <Line
                    type="monotone"
                    dataKey={chart.bestKey}
                    name="Best lap"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={chart.selectedKey}
                    name={`Lap ${selectedLapNumber}`}
                    stroke="var(--foreground)"
                    strokeWidth={2}
                    strokeOpacity={0.6}
                    strokeDasharray="6 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
