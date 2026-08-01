import type { GraphStateType } from "../state.js";
import { validateProposeArtifacts } from "../lib/artifacts.js";
import { proposePrompt, runPi } from "../lib/pi.js";

export async function runPropose(
  state: GraphStateType,
): Promise<Partial<GraphStateType>> {
  const changeName = state.changeName;
  if (!changeName) {
    return { route: "error", error: "propose: changeName is missing" };
  }

  try {
    const result = await runPi({
      projectPath: state.projectPath,
      role: "plan",
      prompt: proposePrompt(changeName, state.projectPath),
    });

    if (result.exitCode !== 0) {
      return {
        route: "error",
        error: `propose failed (exit ${result.exitCode}): ${tail(result.stderr || result.stdout)}`,
      };
    }

    const check = validateProposeArtifacts(state.projectPath, changeName);
    if (!check.ok) {
      return { route: "error", error: `propose artifacts: ${check.reason}` };
    }

    return { route: "check_active" };
  } catch (err) {
    return {
      route: "error",
      error: `propose spawn error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function tail(text: string, max = 800): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(-max);
}
