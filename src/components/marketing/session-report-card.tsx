import { Flag, ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function SessionReportCard() {
  return (
    <Card className="w-full max-w-md text-left">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base">Session Insights — Monza</CardTitle>
        <CardDescription>Practice · 14 laps</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-4">
        <div className="flex gap-3">
          <Flag
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Habit
            </p>
            <p className="mt-1 text-sm">Coasting into Turn 1.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <ArrowRight
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              Try this next
            </p>
            <p className="mt-1 text-sm">
              Stay committed to the throttle a little longer into Turn 1
              before you brake.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
