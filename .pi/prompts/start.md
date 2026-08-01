---
description: "Start or resume root delivery protocol (canon → loops) via PROGRESS.md"
---

Run **root delivery** (`/start`).

**First action (mandatory):** Read and follow exactly:

`.agents/skills/ddd-start/SKILL.md`

Then:

1. Read `canon/PROGRESS.md`.
2. If any stage is `in_progress` or `waiting_user` → **resume** it (do not pick a new pending).
3. Else first `pending` → `in_progress` → execute that stage.
4. Arg «начать заново» only resets after explicit confirm per skill.
5. After the turn: set `waiting_user` when awaiting the human; print **Command hints** (`/work` · `/next` · `/start`).

**Input**: The argument after `/start` (optional).
**Provided arguments**: $@
