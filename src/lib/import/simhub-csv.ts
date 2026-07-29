// Parses telemetry CSVs logged by SimHub's Logging feature, configured to
// output the columns below. SimHub normalizes these property names across
// every sim it supports (confirmed against SimHub's own MQTT publisher
// source and several independent community plugins), which is what makes
// one parser here usable regardless of which game produced the session.
const REQUIRED_COLUMNS = [
  "Gear",
  "Throttle",
  "Brake",
  "Rpms",
  "SpeedKmh",
  "CurrentLap",
  "CompletedLaps",
  "CurrentLapTime",
  "LastLapTime",
  "Sector1LastLapTime",
  "Sector2LastLapTime",
  "Sector3LastLapTime",
  "SessionOdo",
] as const;

type ColumnName = (typeof REQUIRED_COLUMNS)[number];

export interface CsvRowError {
  row: number;
  message: string;
}

export interface NormalizedTelemetryPoint {
  sampleIndex: number;
  timestampMs: number;
  distanceMeters: number;
  speedKph: number;
  throttlePct: number;
  brakePct: number;
  // SimHub does not expose steering angle as a cross-game property (verified
  // absent from its normalized data model) - defaulted until a real source exists.
  steeringAngleDeg: number;
  gear: number;
  rpm: number;
}

export interface NormalizedLap {
  lapNumber: number;
  lapTimeMs: number;
  isValid: boolean;
  sector1Ms: number;
  sector2Ms: number;
  sector3Ms: number;
  telemetryPoints: NormalizedTelemetryPoint[];
}

export interface NormalizedSession {
  laps: NormalizedLap[];
  lapCount: number;
  bestLapMs: number;
  averageLapMs: number;
}

export interface NormalizeSimHubCsvResult {
  session: NormalizedSession;
  rowErrors: CsvRowError[];
}

interface ParsedRow {
  gear: number;
  throttlePct: number;
  brakePct: number;
  rpm: number;
  speedKph: number;
  completedLaps: number;
  currentLapTimeMs: number;
  lastLapTimeMs: number;
  sector1Ms: number;
  sector2Ms: number;
  sector3Ms: number;
  sessionOdoMeters: number;
}

function parseCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim());
}

function buildColumnIndex(header: string[]): Record<ColumnName, number> {
  const index: Partial<Record<ColumnName, number>> = {};
  header.forEach((name, position) => {
    if ((REQUIRED_COLUMNS as readonly string[]).includes(name)) {
      index[name as ColumnName] = position;
    }
  });

  const missing = REQUIRED_COLUMNS.filter((name) => index[name] === undefined);
  if (missing.length > 0) {
    throw new Error(`CSV is missing required columns: ${missing.join(", ")}`);
  }

  return index as Record<ColumnName, number>;
}

function parseNumber(raw: string): number | null {
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseInteger(raw: string): number | null {
  const value = parseNumber(raw);
  return value !== null && Number.isInteger(value) ? value : null;
}

const GEAR_PATTERN = /^-?\d+$/;

// SimHub reports Gear as a string ("R" / "N" / "1".."N"); reverse and
// neutral have no numeric form in the source data, so -1/0 is our own
// convention rather than something SimHub defines.
function parseGear(raw: string): number | null {
  const upper = raw.trim().toUpperCase();
  if (upper === "R") return -1;
  if (upper === "N") return 0;
  return GEAR_PATTERN.test(upper) ? Number(upper) : null;
}

const LAP_TIME_PATTERN = /^(\d+):(\d{2})\.(\d{1,3})$/;

// SimHub serializes TimeSpan properties (lap/sector times) as "mm:ss.fff".
function parseLapTimeMs(raw: string): number | null {
  const match = LAP_TIME_PATTERN.exec(raw.trim());
  if (!match) return null;
  const [, minutes, seconds, millis] = match;
  return Number(minutes) * 60_000 + Number(seconds) * 1_000 + Number(millis.padEnd(3, "0"));
}

function parseRow(
  cells: string[],
  columnIndex: Record<ColumnName, number>,
  rowNumber: number,
): { ok: true; row: ParsedRow } | { ok: false; error: CsvRowError } {
  const get = (name: ColumnName) => cells[columnIndex[name]]?.trim() ?? "";

  const fieldParsers: { key: keyof ParsedRow; column: ColumnName; parse: (raw: string) => number | null }[] = [
    { key: "gear", column: "Gear", parse: parseGear },
    { key: "throttlePct", column: "Throttle", parse: parseNumber },
    { key: "brakePct", column: "Brake", parse: parseNumber },
    { key: "rpm", column: "Rpms", parse: parseNumber },
    { key: "speedKph", column: "SpeedKmh", parse: parseNumber },
    { key: "completedLaps", column: "CompletedLaps", parse: parseInteger },
    { key: "currentLapTimeMs", column: "CurrentLapTime", parse: parseLapTimeMs },
    { key: "lastLapTimeMs", column: "LastLapTime", parse: parseLapTimeMs },
    { key: "sector1Ms", column: "Sector1LastLapTime", parse: parseLapTimeMs },
    { key: "sector2Ms", column: "Sector2LastLapTime", parse: parseLapTimeMs },
    { key: "sector3Ms", column: "Sector3LastLapTime", parse: parseLapTimeMs },
    { key: "sessionOdoMeters", column: "SessionOdo", parse: parseNumber },
  ];

  const row = {} as ParsedRow;
  for (const { key, column, parse } of fieldParsers) {
    const value = parse(get(column));
    if (value === null) {
      return { ok: false, error: { row: rowNumber, message: `Could not parse "${column}" value.` } };
    }
    row[key] = value;
  }

  return { ok: true, row };
}

function groupRowsByLap(rows: ParsedRow[]): ParsedRow[][] {
  const groups: ParsedRow[][] = [];
  let currentCompletedLaps: number | null = null;

  for (const row of rows) {
    if (currentCompletedLaps === null || row.completedLaps !== currentCompletedLaps) {
      groups.push([]);
      currentCompletedLaps = row.completedLaps;
    }
    groups[groups.length - 1].push(row);
  }

  return groups;
}

// The final group is the lap still in progress when the file ends (or the
// session was stopped mid-lap) - its final lap/sector times aren't known
// yet, so it's dropped rather than recorded as a completed lap.
function buildLaps(groups: ParsedRow[][]): NormalizedLap[] {
  const laps: NormalizedLap[] = [];

  for (let i = 0; i < groups.length - 1; i++) {
    const group = groups[i];
    const closingRow = groups[i + 1][0];
    const startOdo = group[0].sessionOdoMeters;

    laps.push({
      lapNumber: group[0].completedLaps + 1,
      lapTimeMs: closingRow.lastLapTimeMs,
      isValid: true,
      sector1Ms: closingRow.sector1Ms,
      sector2Ms: closingRow.sector2Ms,
      sector3Ms: closingRow.sector3Ms,
      telemetryPoints: group.map((row, sampleIndex) => ({
        sampleIndex,
        timestampMs: row.currentLapTimeMs,
        distanceMeters: row.sessionOdoMeters - startOdo,
        speedKph: row.speedKph,
        throttlePct: row.throttlePct,
        brakePct: row.brakePct,
        steeringAngleDeg: 0,
        gear: row.gear,
        rpm: row.rpm,
      })),
    });
  }

  return laps;
}

export function normalizeSimHubCsv(rawContent: string): NormalizeSimHubCsvResult {
  const lines = rawContent.split(/\r\n|\r|\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error("CSV file has no content.");
  }

  const columnIndex = buildColumnIndex(parseCsvLine(lines[0]));

  const rowErrors: CsvRowError[] = [];
  const parsedRows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const result = parseRow(parseCsvLine(lines[i]), columnIndex, i + 1);
    if (result.ok) {
      parsedRows.push(result.row);
    } else {
      rowErrors.push(result.error);
    }
  }

  const laps = buildLaps(groupRowsByLap(parsedRows));
  if (laps.length === 0) {
    throw new Error("No complete laps could be parsed from this file.");
  }

  const lapTimes = laps.map((lap) => lap.lapTimeMs);

  return {
    session: {
      laps,
      lapCount: laps.length,
      bestLapMs: Math.min(...lapTimes),
      averageLapMs: Math.round(lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length),
    },
    rowErrors,
  };
}
