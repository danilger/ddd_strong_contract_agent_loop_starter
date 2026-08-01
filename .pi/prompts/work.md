---
description: "Work on the current PROGRESS stage (feedback, edits, spawn loop help)"
---

Run **stage work** (`/work`).

**First action (mandatory):** Read `.agents/skills/ddd-start/SKILL.md` § `/work` and the current stage section.

Then:

1. Read `canon/PROGRESS.md` — require a stage in `in_progress` or `waiting_user`.
2. Apply the user message **only** to that stage (edits, answers, loop spawn help).
3. Do **not** mark the stage `done` or advance (use `/next` for that).
4. Stage 13: root may edit `contract/src`. Stages 12/15/16: help or background-spawn loop; do not block until loop ends. Stage 1: bootstrap install commands.
5. Set/keep `waiting_user`; print **Command hints**.

**Input**: The argument after `/work` (optional).
**Provided arguments**: $@
