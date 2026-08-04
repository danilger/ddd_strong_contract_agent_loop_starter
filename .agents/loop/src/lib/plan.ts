import fs from "node:fs";
import path from "node:path";

/** Strip checklist / bullet prefixes; plan.yml is a flat list of change slugs. */
const SLUG_PREFIX_RE = /^(?:[-*]\s+)?(?:\[[ xX]\]\s+)?/;

/** OpenSpec / plan.yml change names: kebab-case only (no underscores). */
export const PLAN_SLUG_KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Normalize one plan.yml line to a change slug, or undefined if empty/comment. */
export function normalizePlanSlug(line: string): string | undefined {
  let s = line.trim();
  if (!s || s.startsWith("#")) {
    return undefined;
  }
  s = s.replace(SLUG_PREFIX_RE, "").trim();
  return s.length > 0 ? s : undefined;
}

/** Assert slug is kebab-case; do not rewrite `_` → `-` (fix handoff must fix plan.yml). */
export function assertKebabPlanSlug(slug: string): void {
  if (!PLAN_SLUG_KEBAB_RE.test(slug)) {
    throw new Error(
      `Invalid plan.yml slug "${slug}": use kebab-case only (e.g. extend-auth-bc-with-roles), no underscores or camelCase.`,
    );
  }
}

/** Read plan.yml as ordered list of change slugs (one per non-empty line). */
export function readPlanSlugs(projectPath: string): string[] {
  const planPath = path.join(projectPath, "plan.yml");
  const raw = fs.readFileSync(planPath, "utf8");
  const slugs: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const slug = normalizePlanSlug(line);
    if (slug) {
      assertKebabPlanSlug(slug);
      slugs.push(slug);
    }
  }
  return slugs;
}
