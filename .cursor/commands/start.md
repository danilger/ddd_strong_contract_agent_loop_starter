---
name: /start
id: start
category: Workflow
description: "DDD strategic planning from idea to canon/ artifacts, then optional contract handoff"
---

Run **DDD strategic planning** (`/start`).

**First action (mandatory):** Read and follow exactly:

`.agents/skills/ddd-start/SKILL.md`

Then:

1. Read `canon/PROGRESS.md` (create/update as the skill requires).
2. Announce the current stage (resume unless the user asked to start over).
3. Execute only that stage; stop at confirm / accept / waiting_user.
4. Do **not** write package feature code or `*/plan.yml` until the user confirms **Этап 10 (contract handoff)** per the skill.
5. On этап 10: fill `*/project.md` and **only** `contract/plan.yml`. Leave `server/plan.yml` without work slugs until **Этап 11** / `/handoff-server` after contract approve.

**Input**: Optional argument after `/start` (e.g. «начать заново», «продолжи с event storming», product one-liner).
