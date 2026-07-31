---
name: ddd-start
description: >-
  Conduct confirm-gated DDD strategic planning from a business idea into canon/
  artifacts (intent, context, event storming, BCs, domain model, rules, use cases,
  architecture), then optionally root handoff to plan.yml. Use when the user runs
  /start, asks to start DDD planning, or resume canon planning.
---

# /start — DDD Strategic Planning → canon/

Goal: walk the user from a rough business idea to agreed architecture artifacts under `canon/`, then optionally run root handoff into package `plan.yml` / `project.md`.

## First actions

1. Read `canon/PROGRESS.md` (create from template if missing).
2. Announce current stage and whether this is resume or fresh start.
3. If the user did not say «начать заново», continue from the first non-`done` stage.
4. Work **one stage per turn**; stop at confirm / accept / waiting_user.

## Out of scope until handoff confirm

- Do **not** write feature code under `contract|server|client/src`.
- Do **not** edit package OpenSpec changes or `*/plan.yml` / package `project.md` until the user explicitly confirms **Этап 10 (Handoff)**.
- Do **not** invent business rules the user did not state; ask instead.
- Point out contradictions between intent, context, event storming, and later artifacts.

## Accept / iterate (anti-loop)

After every review or proposal for stages 3–9, end with exactly two choices:

1. **Принять как финальный** (mark stage `done` in `PROGRESS.md`, advance).
2. **Ещё итерация** (stay on stage; apply feedback or wait for user edits).

Never loop reviews without offering accept.

## PROGRESS.md

Keep statuses: `pending | in_progress | waiting_user | done`.

Update after every stage transition. Stages:

| # | id | Artifact |
|---|-----|----------|
| 1 | intent | `canon/01_intent.md` |
| 2 | context | `canon/02_context/context.md` |
| 3 | event_storming | `canon/03_event_storming.dio` |
| 4 | event_storming_analysis | (agreed flow; notes in PROGRESS) |
| 5 | bounded_contexts | `canon/04_bounded_contexts.md` |
| 6 | domain_model | `canon/05_domain_model.md` |
| 7 | rules | `canon/06_rules.md` |
| 8 | use_cases | `canon/07_use_cases.md` |
| 9 | architecture | `canon/08_architecture.md` |
| 10 | handoff | package `project.md` + `plan.yml` (optional) |

---

## Этап 1: Intent

Ask the user to describe the product idea in business terms (no stack, no frameworks).

Tasks:

- Strip technical details.
- Capture system goal and primary business problem.
- Ask clarifying questions; draft a short intent.

Save only after explicit confirm → `canon/01_intent.md`. Mark stage `done`.

---

## Этап 2: Context

Ask the user to add all project materials into `canon/02_context/` (docs, notes, exports). Wait until they say they are finished (e.g. «готово»).

Then:

- Read all files in that folder.
- Align with `canon/01_intent.md`.
- Remove noise and duplicates.
- Write structured summary → `canon/02_context/context.md`.

Confirm with user → mark `done`.

---

## Этап 3: Event Storming (user-owned `.dio`)

Sources: `01_intent.md`, `02_context/context.md`. File: `canon/03_event_storming.dio` (legend for Domain Event / Command / Actor / Policy is already in the file).

1. In chat, propose starter lists: **Domain Events**, **Commands**, **Actors**, **Policies** (recommendations only).
2. Ask the user to fill `03_event_storming.dio` themselves using the legend.
3. Do **not** edit the `.dio` unless the user explicitly asks you to apply edits.
4. Wait for «закончил» / «проверь» / equivalent.
5. Review: wrong card types, missing steps, illogical transitions; give recommendations.
6. Offer **принять файл как финальный** | **ещё итерация**.

On accept → mark stage `done`.

---

## Этап 4: Event Storming analysis

Analyze `canon/03_event_storming.dio`:

- Duplicates, process gaps, causal links, bad connections.

Format: findings + fix suggestions. Iterate with accept/iterate until the user accepts the agreed event flow. Record brief agreement notes in `PROGRESS.md`. Mark `done`.

---

## Этап 5: Bounded Contexts

Group events by meaning; propose BC boundaries; explain the split. User may correct. Accept/iterate.

Save → `canon/04_bounded_contexts.md`. Mark `done`.

---

## Этап 6: Domain model

Per bounded context propose: Entities, Value Objects, Aggregates.

Requirements: business meaning only — no frameworks, DBs, or API shapes.

Accept/iterate → `canon/05_domain_model.md`. Mark `done`.

---

## Этап 7: Rules and invariants

Per Aggregate: invariants, business rules, where they live (in domain language).

Accept/iterate → `canon/06_rules.md`. Mark `done`.

---

## Этап 8: Use cases

Derive from Commands (event storming) + domain model.

For each: inputs, steps, domain operations. Business language only.

Accept/iterate → `canon/07_use_cases.md`. Mark `done`.

Note: these are **canon** use cases; they are **not** Nest `*UseCase` classes.

---

## Этап 9: Architecture projection

Propose:

- Module structure by BC.
- Layers: domain / application / infrastructure (align with `server/AGENTS.md`).
- Interaction contracts (toward `@repo/contract`).

State explicitly: canon use cases map to **Commands/Queries** in code, not `*UseCase` classes.

Accept/iterate → `canon/08_architecture.md`. Mark `done`.

Optional mention of scaffolding a starter is informational only — do not generate package code here.

---

## Этап 10: Root handoff (separate confirm)

After stage 9 is `done`, ask:

> Запустить root handoff сейчас? (заполнить `*/project.md` и `contract|server/plan.yml`; `client/plan.yml` остаётся пустым)

### If no

Set handoff status to skipped / not requested in `PROGRESS.md`. Stop. Canon planning is complete.

### If yes

Follow root [`AGENTS.md`](../../../AGENTS.md) handoff rules:

1. Ensure loop-required files exist in each package (`contract|server|client`):
   `project.md`, `plan.yml`, `openspec/config.yaml`, `AGENTS.md`.
   Root has no OpenSpec contour.
2. Fill `contract/plan.yml` with contract slugs.
3. Fill `server/plan.yml` with code/BC slugs **and** `add_to_client_plan_<client-slug>` entries (never raw client slugs as plan lines).
4. Leave `client/plan.yml` empty (no work slugs).
5. Fill package `project.md` files with product context distilled from `canon/` (domains, scenarios, constraints). Leave architecture rules in `*/AGENTS.md`.
6. Do **not** implement features in package `src`.

Mark handoff `done` in `PROGRESS.md`. Suggest next operator step: run contract loop, then server, then client (see README).

---

## Completion

Planning is complete when stages 1–9 are `done` and artifacts exist. Handoff is complete only after stage 10 confirm and apply (or explicitly skipped).
