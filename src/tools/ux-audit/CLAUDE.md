# Flowlaps UX Audit Agent

## What this is

A CLI agent that audits the locally-running Flowlaps app against its brand
kit (color palette, spacing scale) and reports violations plus general
visual notes. Run manually, on demand, against a dev server route.

It's an **agent**, not just a script with an API call bolted on: the
control flow isn't hardcoded end-to-end. Deterministic style-checking
(tools 1–3 below) feeds into a reasoning step where Claude looks at the
screenshot + the violations list together and decides what's actually
worth flagging and how to prioritize it. That decision step is what makes
it agentic, independent of the fact that it's invoked from a CLI.

## Architecture

Single-shot pipeline, no watch mode, no persistent loop:

```
captureScreenshot(route) → getComputedStyles(route) → checkAgainstBrandKit(styles) → reviewScreenshot(route, screenshotPath, violations) → cli.ts assembles the markdown report
```

### Tools

1. **`captureScreenshot(route)`** (`capture.ts`)
   Playwright headless, navigates to a local dev server route, full-page
   screenshot. Feeds Claude's vision for things no ruleset can express
   (crowding, low-contrast-in-context, misalignment).

2. **`getComputedStyles(route)`** (`capture.ts`)
   Same Playwright session (shared browser/page with `captureScreenshot`).
   Walks the DOM, pulls `getComputedStyle()` per element for `color`,
   `background-color`, `padding`, `margin`, `font-size`. Exact values, not
   a vision model's guess. `color`/`background-color` are normalized to a
   canonical `rgba()` (drawn into a 1x1 canvas, read back as a pixel)
   rather than returned as the raw computed-style string — see Brand
   tokens below for why that normalization is necessary.

3. **`checkAgainstBrandKit(styles)`** (`check.ts`)
   Plain code — **not** an LLM call. Compares extracted values against
   `brand-tokens.ts` (below) and flags anything that doesn't match a
   defined token. Deterministic and fast on purpose: don't ask an LLM
   "does this hex match the palette" when a string comparison answers it
   exactly. Non-visual tags (`head`, `meta`, `link`, `script`, etc.) are
   filtered out before checking — walking the raw DOM includes plenty of
   elements that were never going to have a meaningful color/spacing
   anyway.

4. **`reviewScreenshot(route, screenshotPath, violations)`** (`review.ts`)
   The one Claude API call in the pipeline (`claude-opus-5`, vision).
   Given the screenshot and the violations list, decides which violations
   are actually worth mentioning and adds open-ended visual/UX
   commentary the deterministic checks can't produce — layout, hierarchy,
   contrast, crowding, whatever's actually worth flagging. Not bounded to
   brand-kit conformance; the design isn't locked down yet, so broader
   design feedback is in scope by intent. Returns Claude's markdown notes
   only — `cli.ts` assembles those into the full report alongside the
   deterministic violations table.

### Why the split matters

Color/spacing conformance is ground truth — check it in code. Claude's
job is everything a fixed ruleset can't cover: does this still *look*
right, is a technically-compliant color choice still a bad call in
context, what's actually worth surfacing vs. noise. Keep that boundary
intact when extending this — don't move rule-checking into a prompt.

## Location in the repo

Flowlaps is a single Next.js app (plain pnpm, not a monorepo) with
everything under `src`. The audit tool lives at `src/tools/ux-audit` —
just another directory in the same package, no workspace boundary, no
separate `package.json`.

```
src/
  tools/
    ux-audit/
      capture.ts       # Playwright screenshot + DOM extraction
      brand-tokens.ts   # extracted color/spacing tokens (see Brand tokens below)
      check.ts          # deterministic brand-token comparison
      review.ts         # Claude API call — screenshot + violations in, review notes out
      cli.ts            # entrypoint, wires the above together
      output/
        screenshots/    # generated screenshots (gitignored)
  reports/              # generated markdown reports (gitignored)
```

## Brand tokens

`src/tools/ux-audit/brand-tokens.ts` — a plain TS module (no importable
token export existed anywhere else in `src` when this was scaffolded, so
this file *is* the extraction the original plan called for, scoped to
what the audit tool needs rather than a repo-wide design-system module).
Sourced from the light-theme (`:root`) values in `src/app/globals.css`.

Colors are stored as canonical `rgba()` strings, not the `oklch()` they're
authored as in `globals.css`. Reason: Tailwind v4 registers its
`--color-*` custom properties as typed `<color>`, so the browser actually
resolves them to `lab(...)` at runtime — comparing raw `oklch()` token
strings against that would never match anything. `getComputedStyles`
normalizes every extracted color the same way (canvas pixel readback, see
Tools above), which is reliable regardless of which CSS color function
produced the value. If the palette in `globals.css` changes, regenerate
`brand-tokens.ts` by re-running that same normalization against the new
values — don't hand-convert oklch to rgb by other means, the two color
spaces aren't a simple formula apart.

Only the light theme is covered for v1 — `.dark` and `.theme-night`
(marketing pages) aren't checked against.

Spacing is Tailwind v4's untouched default base unit (4px) —
`globals.css` doesn't override `--spacing`, so `checkAgainstBrandKit`
just verifies padding/margin values land on that grid rather than
checking against an explicit token list.

## Conventions

- TypeScript, matches the Flowlaps stack (React/TS).
- Keep tools 1–3 pure/deterministic where possible — easiest to test and
  cheapest to run repeatedly.
- The Claude review step is the only non-deterministic part; treat its
  output as a draft report a human skims, not a pass/fail gate.
- Manual trigger only for v1 — no file watcher, no CI hook. Don't add
  one without deciding on step limits / cost caps first.

## Commands

```
pnpm ux-audit -- --route /dashboard
```

Not `pnpm audit` — that's pnpm's own built-in dependency vulnerability scan and
takes precedence over a same-named package.json script, so a script literally
named `audit` is silently unreachable via the bare `pnpm audit` form.

## Output

A markdown report per run: route, screenshot reference, violations table
(expected vs. actual token values), and Claude's prioritized visual
notes. Written to `src/reports/`, meant to be pasteable into a PR
description or Flowlaps issue. Screenshots land in
`src/tools/ux-audit/output/screenshots/`. Both directories are
gitignored — treat them as run artifacts, not committed history; the
screenshot path in a report is a local filesystem reference, not a
hosted image, so it won't render if pasted somewhere else.
