import { chromium, type Browser, type Page } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.UX_AUDIT_BASE_URL ?? "http://localhost:3000";
const OUTPUT_DIR = path.join(__dirname, "output", "screenshots");

let browser: Browser | undefined;
let page: Page | undefined;

async function getPage(): Promise<Page> {
  if (!browser) {
    browser = await chromium.launch();
  }
  if (!page) {
    page = await browser.newPage();
  }
  return page;
}

async function gotoRoute(route: string): Promise<Page> {
  const target = new URL(route, BASE_URL);
  // `new URL(route, BASE_URL)` resolves an absolute URL in `route` (e.g.
  // "https://evil.example") to itself, ignoring BASE_URL entirely — this
  // tool should only ever navigate within the local dev server it's told
  // to audit.
  if (target.origin !== new URL(BASE_URL).origin) {
    throw new Error(
      `Route must be a path on ${BASE_URL}, not an absolute URL to a different origin: ${route}`,
    );
  }

  const p = await getPage();
  await p.goto(target.toString(), { waitUntil: "networkidle" });
  return p;
}

export async function closeBrowser(): Promise<void> {
  await browser?.close();
  browser = undefined;
  page = undefined;
}

export async function captureScreenshot(route: string): Promise<string> {
  const p = await gotoRoute(route);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const fileName = `${route.replace(/^\/|\/$/g, "").replace(/\//g, "_") || "root"}.png`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  await p.screenshot({ path: filePath, fullPage: true });

  return filePath;
}

export interface ElementStyles {
  tag: string;
  color: string;
  backgroundColor: string;
  padding: string;
  margin: string;
  fontSize: string;
}

export async function getComputedStyles(route: string): Promise<ElementStyles[]> {
  const p = await gotoRoute(route);

  return p.evaluate(() => {
    // Computed color values can come back in whatever color space they were
    // declared in (oklch, lab, rgb, ...) — this app's CSS variables in
    // particular resolve to lab() at runtime even though they're authored
    // as oklch() in globals.css. Comparing those raw strings against brand
    // tokens would be comparing apples to oranges, so every color is
    // normalized to a canonical rgba() by drawing it into a 1x1 canvas and
    // reading the resulting pixel back — that's always concrete sRGB
    // regardless of which color function produced it.
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    const elements = Array.from(document.querySelectorAll("*"));

    return elements.map((el) => {
      const computed = window.getComputedStyle(el);

      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = computed.color;
      ctx.fillRect(0, 0, 1, 1);
      const [cr, cg, cb, ca] = ctx.getImageData(0, 0, 1, 1).data;

      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = computed.backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
      const [br, bg, bb, ba] = ctx.getImageData(0, 0, 1, 1).data;

      return {
        tag: el.tagName.toLowerCase(),
        color: `rgba(${cr}, ${cg}, ${cb}, ${(ca / 255).toFixed(3)})`,
        backgroundColor: `rgba(${br}, ${bg}, ${bb}, ${(ba / 255).toFixed(3)})`,
        padding: computed.padding,
        margin: computed.margin,
        fontSize: computed.fontSize,
      };
    });
  });
}
