import type { GraphStateType } from "../state.js";
import { resolveProjectPath } from "../config.js";
import { listMissingRequiredFiles } from "../lib/openspecFs.js";

export function checkRequiredFiles(
  state: GraphStateType,
): Partial<GraphStateType> {
  const projectPath = resolveProjectPath(state.projectPath);
  if (!projectPath) {
    return {
      route: "error",
      error:
        'projectPath is required. Pass { "projectPath": "D:\\\\projects\\\\my-app" } in input or set PROJECT_PATH in .env',
    };
  }

  const missing = listMissingRequiredFiles(projectPath);
  if (missing.length > 0) {
    return {
      projectPath,
      route: "missing_files",
      message: `Missing required files: ${missing.join(", ")}. Create them before running the loop.`,
    };
  }
  return { projectPath, route: "check_active" };
}
