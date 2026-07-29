import { describe, expect, it } from "vitest";
import { normalizeSimHubCsv } from "./simhub-csv";

const HEADER =
  "Gear,Throttle,Brake,Rpms,SpeedKmh,CurrentLap,CompletedLaps,CurrentLapTime,LastLapTime,Sector1LastLapTime,Sector2LastLapTime,Sector3LastLapTime,SessionOdo";

function row(fields: {
  gear?: string;
  throttle?: string;
  brake?: string;
  rpms?: string;
  speedKmh?: string;
  currentLap?: string;
  completedLaps: string;
  currentLapTime: string;
  lastLapTime?: string;
  sector1?: string;
  sector2?: string;
  sector3?: string;
  odo: string;
}): string {
  return [
    fields.gear ?? "3",
    fields.throttle ?? "100",
    fields.brake ?? "0",
    fields.rpms ?? "6500",
    fields.speedKmh ?? "180",
    fields.currentLap ?? "1",
    fields.completedLaps,
    fields.currentLapTime,
    fields.lastLapTime ?? "0:00.000",
    fields.sector1 ?? "0:00.000",
    fields.sector2 ?? "0:00.000",
    fields.sector3 ?? "0:00.000",
    fields.odo,
  ].join(",");
}

// One two-lap session: lap 1 runs for 3 samples then closes (CompletedLaps
// flips to 1 on the row that reports lap 1's final time/splits), lap 2 runs
// for 2 samples and is left in progress (no closing row) to exercise the
// trailing-incomplete-lap drop.
const TWO_LAP_CSV = [
  HEADER,
  row({ completedLaps: "0", currentLapTime: "0:00.000", odo: "0" }),
  row({ completedLaps: "0", currentLapTime: "0:01.000", odo: "50" }),
  row({ completedLaps: "0", currentLapTime: "0:02.000", odo: "100" }),
  row({
    completedLaps: "1",
    currentLapTime: "0:00.000",
    lastLapTime: "1:30.500",
    sector1: "0:30.100",
    sector2: "0:30.200",
    sector3: "0:30.200",
    odo: "150",
  }),
  row({ completedLaps: "1", currentLapTime: "0:01.500", odo: "220" }),
].join("\n");

describe("normalizeSimHubCsv", () => {
  it("normalizes rows into completed laps with per-lap telemetry", () => {
    const { session, rowErrors } = normalizeSimHubCsv(TWO_LAP_CSV);

    expect(rowErrors).toEqual([]);
    expect(session.laps).toHaveLength(1);

    const [lap] = session.laps;
    expect(lap.lapNumber).toBe(1);
    expect(lap.lapTimeMs).toBe(90_500);
    expect(lap.sector1Ms).toBe(30_100);
    expect(lap.sector2Ms).toBe(30_200);
    expect(lap.sector3Ms).toBe(30_200);
    expect(lap.telemetryPoints).toHaveLength(3);
    expect(lap.telemetryPoints[0]).toMatchObject({
      sampleIndex: 0,
      timestampMs: 0,
      distanceMeters: 0,
      gear: 3,
      steeringAngleDeg: 0,
    });
    expect(lap.telemetryPoints[2].distanceMeters).toBe(100);
  });

  it("drops the trailing in-progress lap that never closes", () => {
    const { session } = normalizeSimHubCsv(TWO_LAP_CSV);
    expect(session.lapCount).toBe(1);
  });

  it("computes bestLapMs and averageLapMs across completed laps", () => {
    const secondLapCsv = [
      TWO_LAP_CSV,
      row({
        completedLaps: "2",
        currentLapTime: "0:00.000",
        lastLapTime: "1:20.000",
        sector1: "0:26.000",
        sector2: "0:27.000",
        sector3: "0:27.000",
        odo: "300",
      }),
    ].join("\n");

    const { session } = normalizeSimHubCsv(secondLapCsv);
    expect(session.lapCount).toBe(2);
    expect(session.bestLapMs).toBe(80_000);
    expect(session.averageLapMs).toBe(85_250);
  });

  it("records a row error for an unparseable value and continues", () => {
    const csv = [
      HEADER,
      row({ completedLaps: "0", currentLapTime: "0:00.000", odo: "0" }),
      row({ completedLaps: "0", currentLapTime: "not-a-time", odo: "50" }),
      row({
        completedLaps: "1",
        currentLapTime: "0:00.000",
        lastLapTime: "1:10.000",
        sector1: "0:23.000",
        sector2: "0:23.000",
        sector3: "0:24.000",
        odo: "150",
      }),
    ].join("\n");

    const { session, rowErrors } = normalizeSimHubCsv(csv);

    expect(rowErrors).toEqual([{ row: 3, message: 'Could not parse "CurrentLapTime" value.' }]);
    expect(session.laps[0].telemetryPoints).toHaveLength(1);
  });

  it("maps R and N gear strings to -1 and 0", () => {
    const csv = [
      HEADER,
      row({ gear: "N", completedLaps: "0", currentLapTime: "0:00.000", odo: "0" }),
      row({ gear: "R", completedLaps: "0", currentLapTime: "0:01.000", odo: "-10" }),
      row({
        completedLaps: "1",
        currentLapTime: "0:00.000",
        lastLapTime: "0:45.000",
        sector1: "0:15.000",
        sector2: "0:15.000",
        sector3: "0:15.000",
        odo: "0",
      }),
    ].join("\n");

    const { session } = normalizeSimHubCsv(csv);
    expect(session.laps[0].telemetryPoints.map((point) => point.gear)).toEqual([0, -1]);
  });

  it("throws and names every missing column when several are absent", () => {
    const csv = "Gear,Throttle\n3,100";
    expect(() => normalizeSimHubCsv(csv)).toThrow(
      "CSV is missing required columns: Brake, Rpms, SpeedKmh, CurrentLap, CompletedLaps, CurrentLapTime, LastLapTime, Sector1LastLapTime, Sector2LastLapTime, Sector3LastLapTime, SessionOdo",
    );
  });

  it("throws when no lap ever completes", () => {
    const csv = [HEADER, row({ completedLaps: "0", currentLapTime: "0:00.000", odo: "0" })].join("\n");
    expect(() => normalizeSimHubCsv(csv)).toThrow(/no complete laps/i);
  });

  it("throws when the file is entirely empty", () => {
    expect(() => normalizeSimHubCsv("")).toThrow(/no content/i);
  });

  it("throws when the file is only whitespace", () => {
    expect(() => normalizeSimHubCsv("   \n\n  ")).toThrow(/no content/i);
  });

  it("records a row error for an unparseable value in a non-numeric-looking column", () => {
    const csv = [
      HEADER,
      row({ gear: "X", completedLaps: "0", currentLapTime: "0:00.000", odo: "0" }),
      row({ completedLaps: "0", currentLapTime: "0:01.000", odo: "50" }),
      row({
        completedLaps: "1",
        currentLapTime: "0:00.000",
        lastLapTime: "0:45.000",
        sector1: "0:15.000",
        sector2: "0:15.000",
        sector3: "0:15.000",
        odo: "100",
      }),
    ].join("\n");

    const { session, rowErrors } = normalizeSimHubCsv(csv);
    expect(rowErrors).toEqual([{ row: 2, message: 'Could not parse "Gear" value.' }]);
    expect(session.laps[0].telemetryPoints).toHaveLength(1);
  });
});
