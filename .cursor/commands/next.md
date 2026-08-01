---
name: /next
id: next
category: Workflow
description: "Accept current PROGRESS stage, advance, and execute the next stage"
---

Run **advance** (`/next`).

**First action (mandatory):** Read `.agents/skills/ddd-start/SKILL.md` § `/next`.

Then:

1. Read `canon/PROGRESS.md` — current stage must be `in_progress` or `waiting_user`.
2. If current stage is **16** (`run_client_and_wait`): run the **stage 16 gate** (no work slugs in server/client `plan.yml`; no active `openspec/changes`). On failure → refuse, stay `waiting_user`, explain.
3. Mark current `done`.
4. Next `pending` → `in_progress` → **immediately execute** that stage in this turn.
5. If no next stage → announce all stages complete.
6. Print **Command hints** (or completion).

**Input**: Optional note (usually empty).
