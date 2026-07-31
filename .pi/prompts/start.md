---
description: "DDD strategic planning from idea to canon/ artifacts, then optional root handoff"
---

Run **DDD strategic planning** (`/start`).

**First action (mandatory):** Read and follow exactly:

`.agents/skills/ddd-start/SKILL.md`

Then:

1. Read `canon/PROGRESS.md` (create/update as the skill requires).
2. Announce the current stage (resume unless the user asked to start over).
3. Execute only that stage; stop at confirm / accept / waiting_user.
4. Do **not** write package feature code or `*/plan.yml` until the user confirms **Этап 10 (Handoff)** per the skill.

**Input**: The argument after `/start` (optional).
**Provided arguments**: $@

Examples: «начать заново», «продолжи с event storming», a short product idea.
