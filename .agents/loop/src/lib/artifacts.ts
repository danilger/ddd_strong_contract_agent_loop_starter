import fs from "node:fs";
import path from "node:path";
import {
  changeDir,
  isChangeInArchive,
} from "./openspecFs.js";

const UNCHECKED_TASK = /^(\s*[-*]\s+)\[\s\]/;

export type ArtifactCheckResult = { ok: true } | { ok: false; reason: string };

export function validateProposeArtifacts(
  projectPath: string,
  changeName: string,
): ArtifactCheckResult {
  const dir = changeDir(projectPath, changeName);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return { ok: false, reason: `Missing change dir: openspec/changes/${changeName}/` };
  }
  for (const file of ["proposal.md", "tasks.md"] as const) {
    const p = path.join(dir, file);
    if (!fs.existsSync(p)) {
      return { ok: false, reason: `Missing artifact: openspec/changes/${changeName}/${file}` };
    }
  }
  return { ok: true };
}

export function validateApplyArtifacts(
  projectPath: string,
  changeName: string,
): ArtifactCheckResult {
  const tasksPath = path.join(changeDir(projectPath, changeName), "tasks.md");
  if (!fs.existsSync(tasksPath)) {
    return { ok: false, reason: `Missing tasks.md for ${changeName}` };
  }
  const content = fs.readFileSync(tasksPath, "utf8");
  const lines = content.split(/\r?\n/);
  const open = lines.filter((line) => UNCHECKED_TASK.test(line));
  if (open.length > 0) {
    return {
      ok: false,
      reason: `tasks.md still has ${open.length} unchecked item(s) for ${changeName}`,
    };
  }
  return { ok: true };
}

export function validateSyncArtifacts(): ArtifactCheckResult {
  return { ok: true };
}

export function validateArchiveArtifacts(
  projectPath: string,
  changeName: string,
): ArtifactCheckResult {
  const dir = changeDir(projectPath, changeName);
  if (fs.existsSync(dir)) {
    return {
      ok: false,
      reason: `Change dir still present after archive: openspec/changes/${changeName}/`,
    };
  }
  if (!isChangeInArchive(projectPath, changeName)) {
    return {
      ok: false,
      reason: `No archive trace found for ${changeName} under openspec/changes/archive/`,
    };
  }
  return { ok: true };
}
