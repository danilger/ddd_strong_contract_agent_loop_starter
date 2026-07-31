import type { GraphStateType } from "../state.js";
import { selectNextChangeFromPlan } from "../lib/openspecFs.js";

export function selectNextFromPlan(
  state: GraphStateType,
): Partial<GraphStateType> {
  const changeName = selectNextChangeFromPlan(state.projectPath);
  if (!changeName) {
    return {
      route: "done",
      message: "No more changes left in plan.yml.",
      changeName: undefined,
    };
  }
  return { changeName, route: "propose" };
}
