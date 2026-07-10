import { describe, expect, it, vi, afterEach } from "vitest";
import { formatLapTime, formatRelativeDate } from "./format";

describe("formatLapTime", () => {
  it("formats minutes, seconds, and milliseconds with padding", () => {
    expect(formatLapTime(138_412)).toBe("2:18.412");
  });

  it("pads single-digit seconds and short millisecond values", () => {
    expect(formatLapTime(65_000)).toBe("1:05.000");
    expect(formatLapTime(500)).toBe("0:00.500");
  });

  it("does not pad or roll over minutes past 60", () => {
    expect(formatLapTime(3_661_999)).toBe("61:01.999");
  });
});

describe("formatRelativeDate", () => {
  const now = new Date("2026-07-10T12:00:00.000Z");

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Today' for a timestamp on the same day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeDate("2026-07-10T09:00:00.000Z")).toBe("Today");
  });

  it("returns 'Yesterday' exactly one day back", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeDate("2026-07-09T12:00:00.000Z")).toBe("Yesterday");
  });

  it("returns a day count for the rest of the past week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeDate("2026-07-07T12:00:00.000Z")).toBe("3 days ago");
  });

  it("falls back to a month/day date beyond a week, omitting the year within the same year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeDate("2026-06-01T12:00:00.000Z")).toBe("Jun 1");
  });

  it("includes the year once the date is more than a year old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeDate("2024-06-01T12:00:00.000Z")).toBe("Jun 1, 2024");
  });
});
