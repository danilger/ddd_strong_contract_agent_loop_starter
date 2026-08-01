import type { GraphStateType } from "../state.js";
import { validateApplyArtifacts } from "../lib/artifacts.js";
import { applyPrompt, runPi } from "../lib/pi.js";

export async function runApply(
  state: GraphStateType,
): Promise<Partial<GraphStateType>> {
  const changeName = state.changeName;
  if (!changeName) {
    return { route: "error", error: "apply: changeName is missing" };
  }

  try {
    const result = await runPi({
      projectPath: state.projectPath,
      role: "code",
      prompt: applyPrompt(changeName, state.projectPath),
    });

    if (result.exitCode !== 0) {
      return {
        route: "error",
        error: `apply failed (exit ${result.exitCode}): ${tail(result.stderr || result.stdout)}`,
      };
    }

    const check = validateApplyArtifacts(state.projectPath, changeName);
    if (!check.ok) {
      return { route: "error", error: `apply artifacts: ${check.reason}` };
    }

    return { route: "sync" };
  } catch (err) {
    return {
      route: "error",
      error: `apply spawn error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function tail(text: string, max = 800): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(-max);
}
