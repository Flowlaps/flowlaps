import type { SessionSummary } from "@/types/session";

export const sessionTypeLabels: Record<SessionSummary["sessionType"], string> = {
  practice: "Practice",
  qualifying: "Qualifying",
  race: "Race",
  hotlap: "Hotlap",
};

export function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}
