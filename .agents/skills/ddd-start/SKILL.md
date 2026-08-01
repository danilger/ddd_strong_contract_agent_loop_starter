---
name: ddd-start
description: >-
  Root delivery protocol via /start, /work, and /next: onboarding and bootstrap
  (stages 0–1), confirm-gated DDD planning into canon/ (stages 2–10), then contract
  handoff, loops, review, server/client through formal completion (stages 11–17).
  Use when the user runs /start, /work, /next, or resumes delivery progress.
---

# Root delivery — `/start` · `/work` · `/next`

Goal: after cloning the starter, walk from environment setup through a business idea, `canon/`, and package loops to formal completion, driven by [`canon/PROGRESS.md`](../../../canon/PROGRESS.md).

## Commands

### `/start`

1. Read `canon/PROGRESS.md` (create from template if missing).
2. If any stage is `in_progress` or `waiting_user` → **resume that stage** (do not pick a new `pending`).
3. Else take the first `pending` → set `in_progress` → execute its logic.
4. Arg «начать заново» only: reset stages to `pending` per user confirmation, then start stage **0**. Never reset without that phrase.
5. One stage focus per turn; after work set `waiting_user` when awaiting the human; always end with **Command hints**.

### `/work`

Scoped work on the **current** `in_progress` / `waiting_user` stage only.

- Prefix `/work` is optional. In this delivery thread, any user message while a stage is active counts as `/work` (unless it is clearly `/start` or `/next`).
- Apply feedback, answer questions, edit stage artifacts, run bootstrap commands, or help/spawn a package loop as the stage allows.
- Do **not** advance `PROGRESS` to the next stage (that is `/next` only).
- After the turn: keep or set `waiting_user`; print **Command hints**.

### `/next`

1. Identify the current `in_progress` or `waiting_user` stage.
2. **Stage 16 gate** (required): before accepting `/next` from `run_client_and_wait`, verify:
   - `server/plan.yml` and `client/plan.yml` have no remaining work slugs (blank lines and `#` comments ok);
   - no active dirs under `server/openspec/changes/` or `client/openspec/changes/` (only `archive/` may hold past changes).
   If the gate fails → refuse `/next`, stay `waiting_user`, list what remains.
3. Mark current stage `done`.
4. If a next `pending` exists → set it `in_progress` and **immediately execute** that stage in the same turn.
5. If none remain → announce formal completion.
6. End with **Command hints** (or completion message).

### Command hints (every turn)

Always end active-stage replies with something like:

> Дальше: `/work <ответ или правка>` · `/next` (принять этап и перейти) · `/start` (resume, если контекст потерян)

## Out of scope / invariants

- Do **not** invent business rules the user did not state; ask via `/work` wait.
- Point out contradictions between intent, context, event storming, and later artifacts.
- Until stage **11**: do not edit package `plan.yml` / `project.md` or feature `src` (except reading). Bootstrap (stage 1) may touch env files and run installs only.
- Until stage **14**: do not fill `server/plan.yml` with work slugs.
- `contract/src`: writable by **contract loop**, and by **root only during stage 13**. Server/client loops stay tool-locked out of `contract/`.
- Root still does not implement server/client feature code in stages 0–17 (loops do); stage 13 may patch `contract/src` only.

## PROGRESS.md

Statuses: `pending | in_progress | waiting_user | done`.

Update after every transition. Stages:

| # | id | Artifact / outcome |
|---|-----|-------------------|
| 0 | onboarding | user understands command protocol + stage map |
| 1 | bootstrap | deps installed; contract builds; loop deps optional-ready |
| 2 | intent | `canon/01_intent.md` |
| 3 | context | `canon/02_context/context.md` |
| 4 | event_storming | `canon/03_event_storming.dio` |
| 5 | event_storming_analysis | agreed flow; notes in PROGRESS |
| 6 | bounded_contexts | `canon/04_bounded_contexts.md` |
| 7 | domain_model | `canon/05_domain_model.md` |
| 8 | rules | `canon/06_rules.md` |
| 9 | use_cases | `canon/07_use_cases.md` |
| 10 | architecture | `canon/08_architecture.md` |
| 11 | contract_handoff | `*/project.md` + `contract/plan.yml` only |
| 12 | run_contract_loop | contract loop running / instructed |
| 13 | review_contract | `/next` = approve contract |
| 14 | server_handoff | `server/plan.yml` filled |
| 15 | run_server_loop | server loop running / instructed |
| 16 | run_client_and_wait | client loop + both plans closed |
| 17 | development_complete | formal end message |

---

## Этап 0: Onboarding

Give a **short** briefing (no walls of text):

1. Commands: `/start` resume, `/work` work on current stage, `/next` accept and advance.
2. Map: 0–1 setup → 2–10 canon → 11–13 contract → 14–16 server/client → 17 done.
3. Contract-first: HTTP only in `@repo/contract`; loops write package code; root orchestrates plans.

Set `waiting_user`. `/next` = user understood. Do not run install yet.

---

## Этап 1: Bootstrap

Walk the user through clone setup (**not** `npm init` in packages). Checklist from repo root:

1. `npm install` (root only — do **not** npm install inside `contract|server|client` as the main path).
2. Copy `server/.env.example` → `server/.env` if missing.
3. `npm run build:contract`.
4. `cd .agents/loop && npm install` (needed before loop stages; do now).
5. Optional hint: `.agents/loop/.env.example` for model API keys — not a `/next` blocker.
6. Smoke: `npm run check:deps` and/or successful `build:contract`.

**Skip:** if root `node_modules` exists and `build:contract` / `check:deps` already succeed — say so and offer `/next`.

On `/work запусти` (or equivalent): give commands and/or run in **background**; do **not** block the chat until install finishes. Verify afterward. Stay `waiting_user`.

`/next` when environment is ready.

---

## Этап 2: Intent

Ask for the product idea in business terms (no stack/frameworks). Strip tech noise; capture goal and primary problem; clarify; draft short intent.

Practical rule: produce/update `canon/01_intent.md` during the stage; `/next` marks done.

Set `waiting_user`. Command hints.

---

## Этап 3: Context

Ask the user (via `/work`) to put materials in `canon/02_context/`. When they say materials are ready:

- Read the folder; align with `01_intent.md`; dedupe; write `canon/02_context/context.md`.

`waiting_user` → `/next` when summary accepted.

---

## Этап 4: Event Storming (user-owned `.dio`)

Sources: intent + context. File: `canon/03_event_storming.dio`.

1. Propose starter lists: Domain Events, Commands, Actors, Policies (chat only).
2. User fills the `.dio` (legend already in file).
3. Do **not** edit `.dio` unless user asks via `/work`.
4. On request, review card types, gaps, transitions; recommend fixes.
5. `/next` = accept file as final.

---

## Этап 5: Event Storming analysis

Analyze `03_event_storming.dio`: duplicates, gaps, causal links. Findings + fixes. Iterate with `/work`. Record brief agreement notes in PROGRESS. `/next` when flow agreed.

---

## Этап 6: Bounded Contexts

Propose BC boundaries from events; explain split. Save `canon/04_bounded_contexts.md`. `/work` to revise; `/next` to accept.

---

## Этап 7: Domain model

Per BC: Entities, VOs, Aggregates — business meaning only (no DB/API). → `canon/05_domain_model.md`. `/next` to accept.

---

## Этап 8: Rules and invariants

Per Aggregate: invariants/rules in domain language. → `canon/06_rules.md`. `/next` to accept.

---

## Этап 9: Use cases

From Commands + domain model; business language; not Nest `*UseCase`. → `canon/07_use_cases.md`. `/next` to accept.

---

## Этап 10: Architecture projection

Module-by-BC; layers per `server/AGENTS.md`; path toward `@repo/contract`. Canon use cases → Commands/Queries in code. → `canon/08_architecture.md`. `/next` to accept. No package feature code here.

---

## Этап 11: Contract handoff

On execute (from `/start` or `/next`):

1. Ensure each package has `project.md`, `plan.yml`, `openspec/config.yaml`, `AGENTS.md`.
2. Fill `*/project.md` from `canon/`.
3. Fill **only** `contract/plan.yml` (`*-contract` → `contract/src/<bc_slug>/`).
4. Leave `server/plan.yml` and `client/plan.yml` without work slugs.
5. No feature `src` implementation.

Then `waiting_user`. Hints: `/next` → stage 12 (run contract loop).

---

## Этап 12: Run contract loop

Explain how to run loop from `.agents/loop`:

```bash
cd .agents/loop
npm run cli -- "<ABS>/contract"
```

On `/work запусти` (or equivalent): give the command and/or spawn CLI **in background**; **do not** wait for loop completion. Stay `waiting_user`.

`/next` when user confirms contract loop finished (prefer wait until loop done before `/next`).

---

## Этап 13: Review contract

User reviews `contract/src`.

- `/work`: root **may edit** `contract/src` (stage-13-only exception) or advise re-running contract loop.
- `/next` = **approve** the contract and advance to server handoff.

---

## Этап 14: Server handoff

Using `canon/` + approved `contract/src/**`:

1. Optionally refresh `server/project.md`.
2. Fill `server/plan.yml` with BC/code slugs only for BCs present in contract, plus `add_to_client_plan_<client-slug>` (never raw client slugs).
3. Do not edit `client/plan.yml` or `contract/**`.
4. No feature `src` on server/client here.

Then `waiting_user`; `/next` → stage 15.

---

## Этап 15: Run server loop

Same pattern as stage 12 with `projectPath` = `…/server`. Background spawn ok; do not block. `waiting_user`; `/next` → stage 16 when server loop is underway or user ready to manage client.

---

## Этап 16: Run client and wait

Inform the user:

- Server loop appends to `client/plan.yml` via `add_to_client_plan_*`.
- When `client/plan.yml` has ≥1 work slug, start client loop (help/`/work запусти` with `…/client`).
- Client may **drain the plan and stop** while server still appends → **restart** client loop.
- Stay on this stage until **both** server and client plans are closed.

`/next` only if **stage 16 gate** passes (see Commands). Otherwise refuse.

---

## Этап 17: Development complete

Executing this stage prints the completion notice and sets `waiting_user`; `/next` marks 17 `done` and states all stages complete.

Tell the user: formal delivery process is finished. Further changes = hotpatch with Pi in `contract|server|client` (+ `/opsx-*`), not this root protocol.

---

## Completion

All stages **0–17** `done` → formal development process finished. Warn the user explicitly.
