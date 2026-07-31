#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import "./config.js";
import { graph } from "./graph.js";

async function main(): Promise<void> {
  const projectPathArg = process.argv[2];
  if (!projectPathArg) {
    console.error("Usage: npx tsx src/cli.ts <project_path>");
    process.exit(2);
  }

  const projectPath = path.resolve(projectPathArg);
  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
    console.error(`Not a directory: ${projectPath}`);
    process.exit(2);
  }

  console.error(`[loop] project=${projectPath}`);

  const result = await graph.invoke({
    projectPath,
    route: "check_files",
  });

  if (result.error) {
    console.error(result.message ?? result.error);
    process.exit(1);
  }

  if (result.message) {
    console.log(result.message);
  } else {
    console.log("Loop finished.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
