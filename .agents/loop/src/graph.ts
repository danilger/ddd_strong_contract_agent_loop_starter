import { END, START, StateGraph } from "@langchain/langgraph";
import "./config.js";
import { GraphState, type Route } from "./state.js";
import { checkRequiredFiles } from "./nodes/checkRequiredFiles.js";
import { checkActiveChanges } from "./nodes/checkActiveChanges.js";
import { selectActiveChange } from "./nodes/selectActiveChange.js";
import { selectNextFromPlan } from "./nodes/selectNextFromPlan.js";
import { runPropose } from "./nodes/runPropose.js";
import { runApply } from "./nodes/runApply.js";
import { runSync } from "./nodes/runSync.js";
import { runArchive } from "./nodes/runArchive.js";
import {
  messageDone,
  messageError,
  messageMissingFiles,
} from "./nodes/messages.js";

function routeTo(state: { route: Route }): string {
  return state.route;
}

const builder = new StateGraph(GraphState)
  .addNode("check_files", checkRequiredFiles)
  .addNode("check_active", checkActiveChanges)
  .addNode("pick_active", selectActiveChange)
  .addNode("select_next", selectNextFromPlan)
  .addNode("propose", runPropose)
  .addNode("apply", runApply)
  .addNode("sync", runSync)
  .addNode("archive", runArchive)
  .addNode("missing_files", messageMissingFiles)
  .addNode("done", messageDone)
  .addNode("report_error", messageError)
  .addEdge(START, "check_files")
  .addConditionalEdges("check_files", routeTo, {
    check_active: "check_active",
    missing_files: "missing_files",
    error: "report_error",
  })
  .addConditionalEdges("check_active", routeTo, {
    pick_active: "pick_active",
    select_next: "select_next",
  })
  .addConditionalEdges("pick_active", routeTo, {
    apply: "apply",
    error: "report_error",
  })
  .addConditionalEdges("select_next", routeTo, {
    propose: "propose",
    done: "done",
  })
  .addConditionalEdges("propose", routeTo, {
    check_active: "check_active",
    error: "report_error",
  })
  .addConditionalEdges("apply", routeTo, {
    sync: "sync",
    error: "report_error",
  })
  .addConditionalEdges("sync", routeTo, {
    archive: "archive",
    error: "report_error",
  })
  .addConditionalEdges("archive", routeTo, {
    check_active: "check_active",
    error: "report_error",
  })
  .addConditionalEdges("missing_files", routeTo, {
    end: END,
  })
  .addConditionalEdges("done", routeTo, {
    end: END,
  })
  .addConditionalEdges("report_error", routeTo, {
    end: END,
  });

export const graph = builder.compile().withConfig({recursionLimit: 100});
