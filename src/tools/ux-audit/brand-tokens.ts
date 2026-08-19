// Light-theme (`:root`) tokens mirrored from src/app/globals.css.
//
// globals.css authors these as oklch(), but the browser resolves Tailwind's
// typed CSS color variables to lab() at runtime (see the comment in
// capture.ts), and capture.ts normalizes every extracted color to rgba() via
// a canvas pixel readback so it's comparable regardless of color space. To
// diff against real values, these are pre-resolved to the same canonical
// rgba() form using that identical normalization, rather than stored as raw
// oklch() strings.
//
// No TS export currently exists elsewhere for these tokens (see CLAUDE.md);
// this file is that extraction, scoped to what the audit tool needs.
//
// Regenerate by running each globals.css `:root` oklch() value through
// capture.ts's canvas-normalize step (fillStyle + fillRect + getImageData on
// a 1x1 canvas) if the palette in globals.css changes.
export const colors: Record<string, string> = {
  background: "rgba(255, 255, 255, 1.000)",
  foreground: "rgba(10, 10, 10, 1.000)",
  card: "rgba(255, 255, 255, 1.000)",
  "card-foreground": "rgba(10, 10, 10, 1.000)",
  popover: "rgba(255, 255, 255, 1.000)",
  "popover-foreground": "rgba(10, 10, 10, 1.000)",
  primary: "rgba(0, 95, 58, 1.000)",
  "primary-foreground": "rgba(250, 250, 250, 1.000)",
  secondary: "rgba(245, 245, 245, 1.000)",
  "secondary-foreground": "rgba(23, 23, 23, 1.000)",
  muted: "rgba(245, 245, 245, 1.000)",
  "muted-foreground": "rgba(115, 115, 115, 1.000)",
  accent: "rgba(245, 245, 245, 1.000)",
  "accent-foreground": "rgba(23, 23, 23, 1.000)",
  destructive: "rgba(231, 0, 11, 1.000)",
  border: "rgba(229, 229, 229, 1.000)",
  input: "rgba(128, 128, 128, 1.000)",
  ring: "rgba(0, 95, 58, 1.000)",
};

export const spacing = {
  // Tailwind v4 default spacing base unit (px) — globals.css doesn't
  // override `--spacing`, so this is the untouched default scale's step.
  unit: 4,
};
