import { config } from "dotenv";
config({ path: ".env.local" });

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { captureScreenshot, getComputedStyles, closeBrowser } from "./capture";
import { checkAgainstBrandKit, type Violation } from "./check";
import { reviewScreenshot } from "./review";

const REPORTS_DIR = path.join(__dirname, "..", "..", "reports");

function parseRoute(argv: string[]): string {
  const index = argv.indexOf("--route");
  const route = index !== -1 ? argv[index + 1] : undefined;
  if (!route) {
    throw new Error('Missing required argument: --route (e.g. --route "/dashboard")');
  }
  return route;
}

function violationsTable(violations: Violation[]): string {
  if (violations.length === 0) {
    return "No brand-token violations found.";
  }
  const rows = violations
    .map((v) => `| \`${v.tag}\` | ${v.property} | ${v.actual} | ${v.expected} |`)
    .join("\n");
  return `| Tag | Property | Actual | Expected |\n| --- | --- | --- | --- |\n${rows}`;
}

function reportFileName(route: string): string {
  const slug = route.replace(/^\/|\/$/g, "").replace(/\//g, "_") || "root";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `ux-audit-${slug}-${timestamp}.md`;
}

async function main() {
  const route = parseRoute(process.argv.slice(2));

  console.log(`Capturing ${route}...`);
  const screenshotPath = await captureScreenshot(route);
  const styles = await getComputedStyles(route);
  await closeBrowser();

  console.log("Checking against brand tokens...");
  const violations = checkAgainstBrandKit(styles);

  console.log("Requesting Claude's review...");
  const notes = await reviewScreenshot(route, screenshotPath, violations);

  const report = `# UX Audit: ${route}

**Date:** ${new Date().toISOString()}
**Screenshot:** ${path.relative(process.cwd(), screenshotPath)}

## Brand-token violations

${violationsTable(violations)}

## Review notes

${notes}
`;

  await mkdir(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, reportFileName(route));
  await writeFile(reportPath, report, "utf-8");

  console.log(`Report written to ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
