import fs from "node:fs";
import path from "node:path";

/** Strip checklist / bullet prefixes; plan.yml is a flat list of change slugs. */
const SLUG_PREFIX_RE = /^(?:[-*]\s+)?(?:\[[ xX]\]\s+)?/;

/** Normalize one plan.yml line to a change slug, or undefined if empty/comment. */
export function normalizePlanSlug(line: string): string | undefined {
  let s = line.trim();
  if (!s || s.startsWith("#")) {
    return undefined;
  }
  s = s.replace(SLUG_PREFIX_RE, "").trim();
  return s.length > 0 ? s : undefined;
}

/** Read plan.yml as ordered list of change slugs (one per non-empty line). */
export function readPlanSlugs(projectPath: string): string[] {
  const planPath = path.join(projectPath, "plan.yml");
  const raw = fs.readFileSync(planPath, "utf8");
  const slugs: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const slug = normalizePlanSlug(line);
    if (slug) {
      slugs.push(slug);
    }
  }
  return slugs;
}
