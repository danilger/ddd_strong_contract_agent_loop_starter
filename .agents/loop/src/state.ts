import { Annotation } from "@langchain/langgraph";

export type Route =
  | "check_files"
  | "check_active"
  | "pick_active"
  | "select_next"
  | "propose"
  | "apply"
  | "sync"
  | "archive"
  | "missing_files"
  | "done"
  | "error"
  | "end";

export const GraphState = Annotation.Root({
  projectPath: Annotation<string>,
  changeName: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  message: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  error: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  route: Annotation<Route>({
    reducer: (_prev, next) => next,
    default: () => "check_files" as Route,
  }),
});

export type GraphStateType = typeof GraphState.State;
