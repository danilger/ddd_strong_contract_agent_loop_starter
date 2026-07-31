import type { GraphStateType } from "../state.js";
import { selectFirstActiveChange } from "../lib/openspecFs.js";

export function selectActiveChange(
  state: GraphStateType,
): Partial<GraphStateType> {
  const changeName = selectFirstActiveChange(state.projectPath);
  if (!changeName) {
    return {
      route: "error",
      error: "Active changes expected but none matched plan.yml order.",
    };
  }
  return { changeName, route: "apply" };
}
