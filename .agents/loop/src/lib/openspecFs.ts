import fs from "node:fs";
import path from "node:path";
import { readPlanSlugs } from "./plan.js";

const REQUIRED_RELATIVE_PATHS = [
  "project.md",
  "plan.yml",
  "openspec/config.yaml",
  "AGENTS.md",
] as const;

export function listMissingRequiredFiles(projectPath: string): string[] {
  return REQUIRED_RELATIVE_PATHS.filter(
    (rel) => !fs.existsSync(path.join(projectPath, rel)),
  );
}

function listSubdirNames(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function listActiveChangeDirs(projectPath: string): string[] {
  const changesDir = path.join(projectPath, "openspec", "changes");
  return listSubdirNames(changesDir).filter((name) => name !== "archive");
}

export function listArchiveEntries(projectPath: string): string[] {
  const archiveDir = path.join(projectPath, "openspec", "changes", "archive");
  if (!fs.existsSync(archiveDir)) {
    return [];
  }
  return fs.readdirSync(archiveDir, { withFileTypes: true }).map((d) => d.name);
}

/** True if archive contains this change (exact name or dated `YYYY-MM-DD-slug`). */
export function isChangeInArchive(projectPath: string, changeName: string): boolean {
  const entries = listArchiveEntries(projectPath);
  return entries.some((entry) => {
    const base = entry.replace(/\.[^.]+$/, ""); // allow files
    return base === changeName || base.endsWith(`-${changeName}`);
  });
}

/** Active change dirs that appear in plan.yml (off-plan ignored). */
export function listActiveChangesInPlan(projectPath: string): string[] {
  const plan = new Set(readPlanSlugs(projectPath));
  return listActiveChangeDirs(projectPath).filter((name) => plan.has(name));
}

/** First plan slug that has an active folder under openspec/changes/. */
export function selectFirstActiveChange(projectPath: string): string | undefined {
  const active = new Set(listActiveChangeDirs(projectPath));
  return readPlanSlugs(projectPath).find((slug) => active.has(slug));
}

/** First plan slug not yet present in archive. */
export function selectNextChangeFromPlan(projectPath: string): string | undefined {
  return readPlanSlugs(projectPath).find(
    (slug) => !isChangeInArchive(projectPath, slug),
  );
}

export function changeDir(projectPath: string, changeName: string): string {
  return path.join(projectPath, "openspec", "changes", changeName);
}

export function hasActiveChangesInPlan(projectPath: string): boolean {
  return listActiveChangesInPlan(projectPath).length > 0;
}
