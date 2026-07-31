import type { GraphStateType } from "../state.js";

export function messageMissingFiles(
  state: GraphStateType,
): Partial<GraphStateType> {
  return {
    route: "end",
    message:
      state.message ??
      "Required project files are missing. Create project.md, plan.yml, openspec/config.yaml, and AGENTS.md.",
    error:
      state.error ??
      "Missing required project files.",
  };
}

export function messageDone(state: GraphStateType): Partial<GraphStateType> {
  return {
    route: "end",
    message: state.message ?? "No more changes left in plan.yml.",
  };
}

export function messageError(state: GraphStateType): Partial<GraphStateType> {
  return {
    route: "end",
    message:
      state.message ??
      (state.error
        ? `Agent/artifact error: ${state.error}`
        : "An error occurred while running the agent."),
  };
}
