import type { GraphStateType } from "../state.js";
import { validateArchiveArtifacts } from "../lib/artifacts.js";
import { archivePrompt, runPi } from "../lib/pi.js";

export async function runArchive(
  state: GraphStateType,
): Promise<Partial<GraphStateType>> {
  const changeName = state.changeName;
  if (!changeName) {
    return { route: "error", error: "archive: changeName is missing" };
  }

  try {
    const result = await runPi({
      projectPath: state.projectPath,
      role: "code",
      prompt: archivePrompt(changeName),
    });

    if (result.exitCode !== 0) {
      return {
        route: "error",
        error: `archive failed (exit ${result.exitCode}): ${tail(result.stderr || result.stdout)}`,
      };
    }

    const check = validateArchiveArtifacts(state.projectPath, changeName);
    if (!check.ok) {
      return { route: "error", error: `archive artifacts: ${check.reason}` };
    }

    return { route: "check_active", changeName: undefined };
  } catch (err) {
    return {
      route: "error",
      error: `archive spawn error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function tail(text: string, max = 800): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(-max);
}
