import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  createAgentSession,
  ModelRuntime,
  resolveCliModel,
  SessionManager,
  SettingsManager,
  type AgentSession,
} from "@earendil-works/pi-coding-agent";
import { getModelForRole, type Role } from "../config.js";
import {
  CONTRACT_READONLY_FOR_PACKAGE_LOOP,
  createPackageProtectedTools,
  isContractLockedPackage,
  PLAN_YML_READONLY_MESSAGE,
} from "./protectPlanYml.js";

/** LangGraph Studio sets PORT to its own listen port; child apps must not inherit it. */
const LANGGRAPH_STUDIO_PORTS = new Set(["2024", "2025"]);

/**
 * Prefer Git Bash over WSL bash on Windows so `node` / `openspec` / npm work.
 * Order: PI_SHELL_PATH → git from PATH → common Git install locations.
 */
function resolvePiShellPath(): string | undefined {
  const fromEnv = process.env.PI_SHELL_PATH?.trim();
  if (fromEnv) {
    if (fs.existsSync(fromEnv)) {
      return path.resolve(fromEnv);
    }
    console.error(`[pi] warning: PI_SHELL_PATH not found: ${fromEnv}`);
  }

  if (process.platform !== "win32") {
    return undefined;
  }

  const candidates: string[] = [];

  try {
    const whereOut = execFileSync("where.exe", ["git"], {
      encoding: "utf8",
      windowsHide: true,
    });
    const gitExe = whereOut.trim().split(/\r?\n/)[0]?.trim();
    if (gitExe) {
      // ...\Git\cmd\git.exe → ...\Git\bin\bash.exe
      const gitRoot = path.dirname(path.dirname(gitExe));
      candidates.push(path.join(gitRoot, "bin", "bash.exe"));
      candidates.push(path.join(gitRoot, "usr", "bin", "bash.exe"));
    }
  } catch {
    // git not on PATH
  }

  for (const base of [
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"],
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Programs")
      : undefined,
  ]) {
    if (!base) continue;
    candidates.push(path.join(base, "Git", "bin", "bash.exe"));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  console.error(
    "[pi] warning: Git Bash not found; Pi may use WSL bash where node/openspec often fail. Set PI_SHELL_PATH.",
  );
  return undefined;
}

function isPiVerbose(): boolean {
  const raw = process.env.PI_VERBOSE?.trim().toLowerCase();
  return raw === "1" || raw === "true";
}

/** Strip NUL bytes (e.g. UTF-16LE WSL stderr) for readable console output. */
function cleanConsoleText(text: string): string {
  return text.replace(/\0/g, "");
}

function extractToolText(result: unknown): string {
  if (!result || typeof result !== "object") {
    return typeof result === "string" ? result : "";
  }
  const content = (result as { content?: unknown }).content;
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .filter(
      (block): block is { type: string; text?: string } =>
        Boolean(block) &&
        typeof block === "object" &&
        (block as { type?: string }).type === "text",
    )
    .map((block) => block.text ?? "")
    .join("");
}

function formatToolCall(toolName: string, args: unknown): string {
  const a =
    args && typeof args === "object" ? (args as Record<string, unknown>) : {};
  switch (toolName) {
    case "bash": {
      const command = typeof a.command === "string" ? a.command : "";
      const timeout =
        typeof a.timeout === "number" ? ` (timeout ${a.timeout}s)` : "";
      return `$ ${command || "..."}${timeout}`;
    }
    case "read":
    case "write":
    case "edit":
    case "grep":
    case "find":
    case "ls": {
      const path =
        (typeof a.path === "string" && a.path) ||
        (typeof a.file_path === "string" && a.file_path) ||
        (typeof a.pattern === "string" && a.pattern) ||
        "";
      return path ? `${toolName} ${path}` : toolName;
    }
    default: {
      try {
        const json = JSON.stringify(args ?? {});
        const clipped =
          json.length > 200 ? `${json.slice(0, 200)}…` : json;
        return `${toolName} ${clipped}`;
      } catch {
        return toolName;
      }
    }
  }
}

/**
 * Human-readable Pi console logger (native interactive-style), not raw JSON.
 * Streams thinking/text and prints tool calls + results.
 */
function createVerboseConsoleLogger() {
  const toolPrinted = new Map<string, number>();
  let thinkingOpen = false;

  const writeThinking = (delta: string) => {
    if (!thinkingOpen) {
      process.stderr.write("\n[thinking]\n");
      thinkingOpen = true;
    }
    process.stderr.write(cleanConsoleText(delta));
  };

  const closeThinking = () => {
    if (thinkingOpen) {
      process.stderr.write("\n");
      thinkingOpen = false;
    }
  };

  return {
    onEvent(event: { type: string; [key: string]: unknown }): void {
      if (event.type === "message_update") {
        const ame = event.assistantMessageEvent as
          | { type: string; delta?: string; content?: string }
          | undefined;
        if (!ame) return;
        if (ame.type === "thinking_delta" && typeof ame.delta === "string") {
          writeThinking(ame.delta);
          return;
        }
        if (ame.type === "thinking_end") {
          closeThinking();
          return;
        }
        if (ame.type === "text_delta") {
          closeThinking();
          // text_delta is also written to stdout by the main subscriber
          return;
        }
        return;
      }

      if (event.type === "tool_execution_start") {
        closeThinking();
        const toolName = String(event.toolName ?? "tool");
        const toolCallId = String(event.toolCallId ?? "");
        toolPrinted.set(toolCallId, 0);
        process.stderr.write(
          `\n${formatToolCall(toolName, event.args)}\n`,
        );
        return;
      }

      if (
        event.type === "tool_execution_update" ||
        event.type === "tool_execution_end"
      ) {
        const toolCallId = String(event.toolCallId ?? "");
        const source =
          event.type === "tool_execution_end"
            ? event.result
            : event.partialResult;
        const full = cleanConsoleText(extractToolText(source));
        const prev = toolPrinted.get(toolCallId) ?? 0;
        if (full.length > prev) {
          process.stderr.write(full.slice(prev));
          toolPrinted.set(toolCallId, full.length);
        }
        if (event.type === "tool_execution_end") {
          if (!full.endsWith("\n")) {
            process.stderr.write("\n");
          }
          if (event.isError) {
            process.stderr.write("[tool error]\n");
          }
          toolPrinted.delete(toolCallId);
        }
      }
    },
    flush(): void {
      closeThinking();
    },
  };
}

function resolvePiChildPort(): string {
  return process.env.PI_AGENT_PORT?.trim() || "3000";
}

function shouldIsolatePortFromStudio(): boolean {
  const port = process.env.PORT?.trim();
  return (
    (port !== undefined && LANGGRAPH_STUDIO_PORTS.has(port)) ||
    Boolean(process.env.LANGGRAPH_API_URL?.trim())
  );
}

/**
 * Pi SDK bash tool reads process.env via getShellEnv(). Temporarily override PORT
 * so nest/dev servers started during apply do not bind to LangGraph Studio's port.
 */
async function withIsolatedPiEnv<T>(fn: () => Promise<T>): Promise<T> {
  if (!shouldIsolatePortFromStudio()) {
    return fn();
  }

  const previousPort = process.env.PORT;
  const childPort = resolvePiChildPort();
  process.env.PORT = childPort;
  console.error(`[pi] isolated PORT=${childPort} (was ${previousPort ?? "unset"})`);

  try {
    return await fn();
  } finally {
    if (previousPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = previousPort;
    }
  }
}

export type PiResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type RunPiOptions = {
  projectPath: string;
  role: Role;
  prompt: string;
};

let cachedModelRuntime: ModelRuntime | undefined;

async function getModelRuntime(): Promise<ModelRuntime> {
  if (!cachedModelRuntime) {
    cachedModelRuntime = await ModelRuntime.create();
  }
  return cachedModelRuntime;
}

async function createPiSession(
  projectPath: string,
  role: Role,
): Promise<AgentSession> {
  const modelRuntime = await getModelRuntime();
  const cliModel = resolveCliModel({
    cliModel: getModelForRole(role),
    modelRuntime,
  });

  if (cliModel.error || !cliModel.model) {
    throw new Error(cliModel.error ?? `Failed to resolve model for role=${role}`);
  }

  if (cliModel.warning) {
    console.error(`[pi] warning: ${cliModel.warning}`);
  }

  const settingsManager = SettingsManager.create(projectPath, undefined, {
    projectTrusted: true,
  });

  const shellPath = resolvePiShellPath();
  if (shellPath) {
    settingsManager.setShellPath(shellPath);
    console.error(`[pi] shellPath=${shellPath}`);
  }

  const { session } = await createAgentSession({
    cwd: projectPath,
    model: cliModel.model,
    thinkingLevel: cliModel.thinkingLevel,
    modelRuntime,
    sessionManager: SessionManager.inMemory(projectPath),
    settingsManager,
    customTools: createPackageProtectedTools(
      projectPath,
      shellPath ? { shellPath } : undefined,
    ),
  });

  return session;
}

/**
 * Run Pi via SDK: createAgentSession + session.prompt in project cwd.
 * Equivalent to `pi --model <role> -p "<prompt>" -a` (project trust enabled).
 */
export async function runPi(options: RunPiOptions): Promise<PiResult> {
  const verbose = isPiVerbose();
  const model = getModelForRole(options.role);
  console.error(`[pi] role=${options.role} model=${model}`);
  console.error(`[pi] prompt=${options.prompt}`);
  console.error(`[pi] cwd=${options.projectPath}`);
  if (verbose) {
    console.error(`[pi] verbose=on (human-readable console)`);
  }

  let session: AgentSession | undefined;
  let stdout = "";
  const verboseLog = verbose ? createVerboseConsoleLogger() : undefined;

  return withIsolatedPiEnv(async () => {
    try {
      session = await createPiSession(options.projectPath, options.role);

      const unsubscribe = session.subscribe((event) => {
        verboseLog?.onEvent(event);

        if (
          event.type === "message_update" &&
          event.assistantMessageEvent.type === "text_delta"
        ) {
          const delta = event.assistantMessageEvent.delta;
          stdout += delta;
          process.stdout.write(delta);
        }
      });

      try {
        await session.prompt(options.prompt);
      } finally {
        unsubscribe();
        verboseLog?.flush();
      }

      const agentError = session.agent.state.errorMessage;
      if (agentError) {
        console.error(`[pi] exit=1`);
        return {
          exitCode: 1,
          stdout,
          stderr: agentError,
        };
      }

      console.error(`[pi] exit=0`);
      return { exitCode: 0, stdout, stderr: "" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[pi] exit=1`);
      return {
        exitCode: 1,
        stdout,
        stderr: message,
      };
    } finally {
      session?.dispose();
    }
  });
}

function hardRulesPrompt(projectPath?: string): string {
  const lines = [
    "",
    "Hard rule:",
    `- ${PLAN_YML_READONLY_MESSAGE}`,
    "- Do not add [x] / checkboxes to plan.yml. Progress is tracked only via OpenSpec archive.",
  ];
  if (projectPath && isContractLockedPackage(projectPath)) {
    lines.push(`- ${CONTRACT_READONLY_FOR_PACKAGE_LOOP}`);
  }
  return lines.join("\n");
}

export function proposePrompt(changeName: string, projectPath?: string): string {
  return `/opsx-propose ${changeName}${hardRulesPrompt(projectPath)}`;
}

export function applyPrompt(changeName: string, projectPath?: string): string {
  return `/opsx-apply ${changeName}${hardRulesPrompt(projectPath)}`;
}

export function syncPrompt(changeName: string, projectPath?: string): string {
  return `/opsx-sync ${changeName}${hardRulesPrompt(projectPath)}`;
}

export function archivePrompt(changeName: string, projectPath?: string): string {
  return [
    `/opsx-archive ${changeName}`,
    "",
    "Non-interactive orchestration mode (no human is available):",
    "- Do NOT ask for confirmation. Auto-approve incomplete-artifact and incomplete-task warnings and continue.",
    '- If a sync choice is required: choose "Archive without syncing" (sync already ran earlier in the pipeline).',
    "- Do NOT use AskUserQuestion or wait for user input.",
    "- You MUST complete the archive move: openspec/changes/<name>/ → openspec/changes/archive/YYYY-MM-DD-<name>/.",
    "- Finish only after the active change directory is gone and the archive folder exists.",
    hardRulesPrompt(projectPath).trim(),
  ].join("\n");
}
