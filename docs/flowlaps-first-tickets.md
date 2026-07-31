# Flowlaps First Tickets

## Ticket 1: Scaffold the repo

Create a Next.js App Router project for Flowlaps using TypeScript, pnpm, Tailwind, and shadcn/ui.

Acceptance criteria:
- App boots locally.
- Base layout exists.
- Shared design tokens or theme foundation are configured.
- Placeholder navigation is present.

## Ticket 2: Build mocked dashboard

Create the main dashboard using mocked telemetry session data.

Acceptance criteria:
- Recent sessions list.
- Summary KPIs.
- Empty state for no sessions.
- Cards for latest coaching reports.

## Ticket 3: Build session detail view

Create a session detail page that shows best lap, average lap, consistency, and sector breakdown.

Acceptance criteria:
- Uses mock data.
- Clean responsive layout.
- Visual hierarchy emphasizes clarity over density.

## Ticket 4: Build lap comparison view

Create a comparison page for best lap vs selected lap.

Acceptance criteria:
- Speed chart.
- Brake chart.
- Throttle chart.
- Summary callouts for broad losses.

## Ticket 5: Define Prisma schema

Create the initial Prisma schema for Driver, Track, Car, Session, Lap, TelemetryPoint, CoachingReport, and PracticeFocusArea.

Acceptance criteria:
- Schema compiles.
- Seed script can insert mock session data.

## Ticket 6: Add import flow

Create an import screen and backend route that accepts a CSV file upload.

Acceptance criteria:
- File upload UI exists.
- Basic file validation exists.
- Upload route stores metadata.
- Parsing errors render clearly.

## Ticket 7: Build normalization layer

Parse the imported file into normalized domain entities.

Acceptance criteria:
- One supported CSV format works end to end.
- Invalid rows are surfaced with useful errors.
- Normalized session data can be viewed in the app.

## Ticket 8: Wire real session data into dashboard, detail, and comparison

Ticket 7 satisfied its own acceptance criteria via a dedicated `/imports/[id]`
view, but `/dashboard`, `/sessions/[id]`, and `/sessions/[id]/compare` are
still 100% hardcoded to mock data (the intended state per Tickets 2-4's own
"uses mock data" acceptance criteria) - so an uploaded session never shows up
in the dashboard's Recent Sessions list. This ticket points those three
surfaces at Prisma instead, using the same seeded dataset (Ticket 5) that
already mirrors the mock data. Split into 3 PRs along the dashboard / detail /
comparison seam.

Acceptance criteria:
- Dashboard's Recent Sessions, KPI summary, and coaching report cards read from Prisma.
- Session detail view reads from Prisma; `/imports/[id]`'s success path is retired in favor of redirecting straight to `/sessions/[id]` (it keeps handling the failed-import case only).
- Lap comparison reads real per-lap telemetry, correctly aligning two laps with different sample counts/spacing rather than assuming a fixed shared grid.

## Ticket 9: Build derived insight engine

Implement pure TypeScript functions to compute derived telemetry insights.

Acceptance criteria:
- Computes pace metrics.
- Computes consistency metrics.
- Computes braking and throttle timing signals.
- Produces structured DerivedInsight objects.

## Ticket 10: Generate coaching report

Create a backend service that converts derived insights into a calm coaching report.

Acceptance criteria:
- Output is plain language.
- Report limits focus areas.
- Report includes a short next-practice plan.

## Ticket 11: Add history view

Create a history page for past reports and focus areas.

Acceptance criteria:
- Prior reports are listable.
- Focus areas are visible over time.
- User can open a prior session report.
