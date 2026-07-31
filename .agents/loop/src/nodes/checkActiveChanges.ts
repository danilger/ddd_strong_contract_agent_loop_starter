import type { GraphStateType } from "../state.js";
import { hasActiveChangesInPlan } from "../lib/openspecFs.js";

export function checkActiveChanges(
  state: GraphStateType,
): Partial<GraphStateType> {
  if (hasActiveChangesInPlan(state.projectPath)) {
    return { route: "pick_active" };
  }
  return { route: "select_next" };
}
