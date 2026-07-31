import { access as fsAccess, mkdir as fsMkdir, readFile as fsReadFile, writeFile as fsWriteFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import {
  createBashToolDefinition,
  createEditToolDefinition,
  createLocalBashOperations,
  createWriteToolDefinition,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";

const PLAN_YML = "plan.yml";

export const PLAN_YML_READONLY_MESSAGE =
  "plan.yml is read-only for the OpenSpec loop orchestrator. Never edit, overwrite, move, or mark items in it.";

export function isPlanYmlPath(projectPath: string, filePath: string): boolean {
  const planPath = path.resolve(projectPath, PLAN_YML);
  const resolved = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(projectPath, filePath);
  return resolved.toLowerCase() === planPath.toLowerCase();
}

export function commandTouchesPlanYml(command: string): boolean {
  return /\bplan\.yml\b/i.test(command);
}

function assertNotPlanYml(projectPath: string, absolutePath: string): void {
  if (isPlanYmlPath(projectPath, absolutePath)) {
    throw new Error(PLAN_YML_READONLY_MESSAGE);
  }
}

/**
 * write / edit / bash tools that refuse mutations to plan.yml
 * (custom tools override builtins by the same name).
 */
export function createPlanProtectedTools(
  projectPath: string,
  options?: { shellPath?: string },
): ToolDefinition<any, any>[] {
  const shellPath = options?.shellPath;
  const localBash = createLocalBashOperations(
    shellPath ? { shellPath } : undefined,
  );

  const write = createWriteToolDefinition(projectPath, {
    operations: {
      writeFile: async (absolutePath, content) => {
        assertNotPlanYml(projectPath, absolutePath);
        await fsWriteFile(absolutePath, content, "utf-8");
      },
      mkdir: (dir) => fsMkdir(dir, { recursive: true }).then(() => {}),
    },
  });

  const edit = createEditToolDefinition(projectPath, {
    operations: {
      readFile: (absolutePath) => fsReadFile(absolutePath),
      writeFile: async (absolutePath, content) => {
        assertNotPlanYml(projectPath, absolutePath);
        await fsWriteFile(absolutePath, content, "utf-8");
      },
      access: async (absolutePath) => {
        await fsAccess(absolutePath, fsConstants.R_OK | fsConstants.W_OK);
      },
    },
  });

  const bash = createBashToolDefinition(projectPath, {
    shellPath,
    operations: {
      exec: async (command, cwd, execOptions) => {
        if (commandTouchesPlanYml(command)) {
          throw new Error(PLAN_YML_READONLY_MESSAGE);
        }
        return localBash.exec(command, cwd, execOptions);
      },
    },
  });

  return [write, edit, bash];
}
