import type { GraphStateType } from "../state.js";
import { validateSyncArtifacts } from "../lib/artifacts.js";
import { runPi, syncPrompt } from "../lib/pi.js";

export async function runSync(
  state: GraphStateType,
): Promise<Partial<GraphStateType>> {
  const changeName = state.changeName;
  if (!changeName) {
    return { route: "error", error: "sync: changeName is missing" };
  }

  try {
    const result = await runPi({
      projectPath: state.projectPath,
      role: "code",
      prompt: syncPrompt(changeName, state.projectPath),
    });

    if (result.exitCode !== 0) {
      return {
        route: "error",
        error: `sync failed (exit ${result.exitCode}): ${tail(result.stderr || result.stdout)}`,
      };
    }

    const check = validateSyncArtifacts();
    if (!check.ok) {
      return { route: "error", error: `sync artifacts: ${check.reason}` };
    }

    return { route: "archive" };
  } catch (err) {
    return {
      route: "error",
      error: `sync spawn error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function tail(text: string, max = 800): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(-max);
}
