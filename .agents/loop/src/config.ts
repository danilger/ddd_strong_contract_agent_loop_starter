import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotenv({ path: path.join(rootDir, ".env") });

export type Role = "plan" | "code" | "review";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getModelForRole(role: Role): string {
  switch (role) {
    case "plan":
      return requireEnv("ROLE_PLAN_MODEL");
    case "code":
      return requireEnv("ROLE_CODE_MODEL");
    case "review":
      return requireEnv("ROLE_REVIEW_MODEL");
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

/** Resolve project root from graph input or PROJECT_PATH env (Studio fallback). */
export function resolveProjectPath(explicit?: string): string | undefined {
  const raw = explicit?.trim() || process.env.PROJECT_PATH?.trim();
  if (!raw) {
    return undefined;
  }
  return path.resolve(raw);
}
