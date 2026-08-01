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

/** Packages whose Pi loop must not mutate sibling `contract/`. */
const CONTRACT_LOCKED_PACKAGES = new Set(["server", "client"]);

export const PLAN_YML_READONLY_MESSAGE =
  "plan.yml is read-only for the OpenSpec loop orchestrator. Never edit, overwrite, move, or mark items in it.";

export const CONTRACT_READONLY_FOR_PACKAGE_LOOP =
  "contract/ is read-only for server/client OpenSpec loops. Only the contract package loop (or root handoff plans) may change it.";

/**
 * True when this projectPath is server/ or client/ (sibling contract must stay locked).
 */
export function isContractLockedPackage(projectPath: string): boolean {
  return CONTRACT_LOCKED_PACKAGES.has(path.basename(path.resolve(projectPath)));
}

/**
 * Absolute path to monorepo `contract/` sibling of the package projectPath.
 */
export function resolveContractRoot(projectPath: string): string {
  return path.resolve(projectPath, "..", "contract");
}

/**
 * True when filePath resolves under the sibling contract package.
 */
export function isUnderContractRoot(
  projectPath: string,
  filePath: string,
): boolean {
  if (!isContractLockedPackage(projectPath)) {
    return false;
  }
  const contractRoot = resolveContractRoot(projectPath);
  const resolved = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(projectPath, filePath);
  const rel = path.relative(contractRoot, resolved);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * Heuristic: bash command likely mutates or targets the contract package.
 */
export function commandTouchesContract(command: string): boolean {
  return (
    /(?:^|[\s"'`=])(?:\.\.\/)+contract(?:\/|\\|\s|$)/i.test(command) ||
    /(?:^|[\s"'`=])contract(?:\/|\\)src(?:\/|\\|\s|$)/i.test(command) ||
    /(?:^|[\s"'`=])(?:\.\/)?contract(?:\/|\\)(?:src|package\.json|plan\.yml|AGENTS\.md|openspec)/i.test(
      command,
    ) ||
    /[\\/]contract[\\/]/i.test(command)
  );
}

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

function assertWritablePath(projectPath: string, absolutePath: string): void {
  if (isPlanYmlPath(projectPath, absolutePath)) {
    throw new Error(PLAN_YML_READONLY_MESSAGE);
  }
  if (isUnderContractRoot(projectPath, absolutePath)) {
    throw new Error(CONTRACT_READONLY_FOR_PACKAGE_LOOP);
  }
}

function assertWritableCommand(projectPath: string, command: string): void {
  if (commandTouchesPlanYml(command)) {
    throw new Error(PLAN_YML_READONLY_MESSAGE);
  }
  if (
    isContractLockedPackage(projectPath) &&
    commandTouchesContract(command)
  ) {
    throw new Error(CONTRACT_READONLY_FOR_PACKAGE_LOOP);
  }
}

/**
 * write / edit / bash tools that refuse mutations to plan.yml and (for
 * server/client) the sibling contract/ package.
 */
export function createPackageProtectedTools(
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
        assertWritablePath(projectPath, absolutePath);
        await fsWriteFile(absolutePath, content, "utf-8");
      },
      mkdir: (dir) => {
        assertWritablePath(projectPath, dir);
        return fsMkdir(dir, { recursive: true }).then(() => {});
      },
    },
  });

  const edit = createEditToolDefinition(projectPath, {
    operations: {
      readFile: (absolutePath) => fsReadFile(absolutePath),
      writeFile: async (absolutePath, content) => {
        assertWritablePath(projectPath, absolutePath);
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
        assertWritableCommand(projectPath, command);
        return localBash.exec(command, cwd, execOptions);
      },
    },
  });

  return [write, edit, bash];
}

/** @deprecated Use createPackageProtectedTools */
export const createPlanProtectedTools = createPackageProtectedTools;
