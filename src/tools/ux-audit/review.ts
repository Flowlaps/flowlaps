import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import type { Violation } from "./check";

const SYSTEM_PROMPT = `You are reviewing a screenshot of a web app page for Flowlaps, a sim racing
telemetry dashboard. You're given the screenshot plus a list of deterministic
brand-token violations already found in the page's DOM (wrong colors, spacing
off the grid) — that list is ground truth, don't second-guess whether those
specific values match the design tokens.

Your job is everything that list can't cover:

- Decide which of the listed violations actually matter enough to mention.
  Some may be trivial (a couple of pixels nobody will notice) — skip those
  rather than padding the report.
- Look at the screenshot itself and flag anything else about the visual
  design worth improving: layout, hierarchy, spacing, alignment, crowding,
  contrast, typography, whitespace, information density — whatever you
  actually notice. The design isn't locked down yet, so open, general design
  feedback is welcome, not just token conformance.
- Prioritize. Lead with what matters most. Don't produce an exhaustive nitpick
  dump — a short list of things worth acting on beats ten minor notes.

Tone: calm and plain-language, like a colleague giving a design review, not a
robotic linter. Say what's wrong and why it matters, not just "X should be Y".

Output plain markdown: a short prose summary, then a prioritized list of
findings. No preamble like "Here's my review" — start directly with content.`;

export async function reviewScreenshot(
  route: string,
  screenshotPath: string,
  violations: Violation[],
): Promise<string> {
  // Constructed here rather than at module scope: this module may be
  // imported before the entrypoint finishes loading env vars (e.g. from
  // .env.local), and ES module import evaluation runs before the importing
  // script's own top-level code — so a module-scope client would read
  // process.env before it's populated.
  const client = new Anthropic();

  const imageData = fs.readFileSync(screenshotPath).toString("base64");

  const violationsList =
    violations.length > 0
      ? violations
          .map((v) => `- <${v.tag}> ${v.property}: got ${v.actual}, expected ${v.expected}`)
          .join("\n")
      : "None found.";

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: imageData },
          },
          {
            type: "text",
            text: `Route: ${route}\n\nDeterministic brand-token violations found in the DOM:\n${violationsList}`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );

  return textBlock?.text ?? "";
}
