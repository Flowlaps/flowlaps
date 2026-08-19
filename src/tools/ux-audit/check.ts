import type { ElementStyles } from "./capture";
import { colors, spacing } from "./brand-tokens";

export interface Violation {
  tag: string;
  property: "color" | "backgroundColor" | "padding" | "margin";
  actual: string;
  expected: string;
}

// Tags that never render visible content — including them would just be
// noise in the violations list (e.g. every page has a <head>/<meta>/<link>
// with a transparent, token-irrelevant "color").
const NON_VISUAL_TAGS = new Set([
  "html",
  "head",
  "meta",
  "link",
  "script",
  "style",
  "title",
  "base",
  "noscript",
  "template",
]);

const TRANSPARENT = "rgba(0, 0, 0, 0.000)";

const TOKEN_COLOR_VALUES = new Set(Object.values(colors));

function isSpacingCompliant(value: string, unit: number): boolean {
  return value.split(" ").every((side) => {
    const match = side.match(/^(-?\d+(?:\.\d+)?)px$/);
    if (!match) return true; // not a plain px value (e.g. "auto") — not ours to judge
    return parseFloat(match[1]) % unit === 0;
  });
}

export function checkAgainstBrandKit(styles: ElementStyles[]): Violation[] {
  const violations: Violation[] = [];

  for (const el of styles) {
    if (NON_VISUAL_TAGS.has(el.tag)) continue;

    if (!TOKEN_COLOR_VALUES.has(el.color)) {
      violations.push({
        tag: el.tag,
        property: "color",
        actual: el.color,
        expected: "one of brand-tokens.colors",
      });
    }

    if (el.backgroundColor !== TRANSPARENT && !TOKEN_COLOR_VALUES.has(el.backgroundColor)) {
      violations.push({
        tag: el.tag,
        property: "backgroundColor",
        actual: el.backgroundColor,
        expected: "one of brand-tokens.colors",
      });
    }

    if (!isSpacingCompliant(el.padding, spacing.unit)) {
      violations.push({
        tag: el.tag,
        property: "padding",
        actual: el.padding,
        expected: `multiple of ${spacing.unit}px`,
      });
    }

    if (!isSpacingCompliant(el.margin, spacing.unit)) {
      violations.push({
        tag: el.tag,
        property: "margin",
        actual: el.margin,
        expected: `multiple of ${spacing.unit}px`,
      });
    }
  }

  return violations;
}
