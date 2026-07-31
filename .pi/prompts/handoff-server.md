---
description: "After approved contract: fill server/plan.yml from contract + canon"
---

Run **server handoff** (этап 11).

**First action (mandatory):** Read and follow exactly the **Этап 11: Server handoff** section in:

`.agents/skills/ddd-start/SKILL.md`

Also respect root `AGENTS.md` § Handoff phase 2.

Then:

1. Read `canon/PROGRESS.md` — require `contract_handoff` = `done`.
2. Require **explicit** user approve of the finished contract («контракт принят» / approve / equivalent). If missing, ask and stop.
3. Draft `server/plan.yml` from `canon/` **and** actual `contract/src/**` (routes, statuses, DTOs).
4. Optionally refresh `server/project.md`. Do **not** edit `contract/src`, `contract/plan.yml`, or `client/plan.yml`.
5. Fill only `server/plan.yml` (code/BC slugs + `add_to_client_plan_*`). No feature code in `src`.
6. Mark `server_handoff` `done` in `PROGRESS.md`. Suggest server loop, then client loop after appends.

**Input**: The argument after `/handoff-server` (optional).
**Provided arguments**: $@
