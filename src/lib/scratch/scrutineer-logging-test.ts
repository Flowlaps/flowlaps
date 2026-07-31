/**
 * Throwaway file for a scratch PR testing Scrutineer's resolved-findings
 * logging (0.8.2). Not part of the product. Safe to delete.
 */
import fs from "node:fs/promises";
import path from "node:path";

export async function readImportArtifact(importId: string, filename: string) {
  const filePath = path.join(process.cwd(), "tmp", "imports", importId, filename);
  return fs.readFile(filePath, "utf-8");
}
