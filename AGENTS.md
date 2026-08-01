# Project Architecture

Monorepo: contract-first, тактические DDD + CQRS.
Детали: `contract/AGENTS.md`, `server/AGENTS.md`, `client/AGENTS.md` (FSD v2.1).

## Инварианты

- `@repo/contract` (`apiContract`) — **единственная** HTTP-граница client ↔ server. Новые endpoints только там.
- Server presentation: только `@TsRestHandler` на роуты из контракта. Nest `@Get` / `@Post` / … **запрещены** (ESLint). Пустой `@Controller()` — оболочка для ts-rest.
- Писать в `contract/` может **contract loop**, root при handoff планов/`project.md`, и **root на этапе 13** (`review_contract`) для правок `contract/src`. Loop@server и loop@client: tool-lock на `../contract/`.
- Папки BC 1:1: `contract/src/<bc_slug>` ↔ `server/src/<bc_slug>` ↔ slug в `canon/04_bounded_contexts.md`. Исключения: `contract/src/shared/`, `contract/src/health/` (+ `server/src/health/`).
- После изменений в пакете: `npm run check` **из cwd этого пакета** (`server/` / `client/` / …).

## Root agent — `/start` · `/work` · `/next`

Корневой агент ведёт delivery по [`canon/PROGRESS.md`](canon/PROGRESS.md). Протокол SSOT: skill `ddd-start` (`.agents/skills/ddd-start/SKILL.md`).

Команды (Cursor: `.cursor/commands/`; Pi: `.pi/prompts/`):

| Command | Role |
|---------|------|
| `/start` | Resume `in_progress`/`waiting_user`, else first `pending` → execute |
| `/work` | Work on current stage only (prefix optional in this thread) |
| `/next` | Mark current `done`, advance, execute next (stage 16 has a plan-closed gate) |

После review контракта: `/next` (этап 13→14).

Корневой агент **не** реализует фичи в `server|client/src`. `contract/src` — только на этапе 13 или через contract loop.

### Этапы 0–1 (setup)

| # | id | Outcome |
|---|-----|---------|
| 0 | onboarding | понять `/start` · `/work` · `/next` и карту этапов |
| 1 | bootstrap | root `npm install`, `server/.env`, `build:contract`, loop deps |

### Этапы 2–10 (canon)

Пишут только `canon/` (`01_intent` … `08_architecture`). До этапа 11 **не** трогать пакетные `plan.yml` / `project.md`.

### Этапы 11–17 (handoff + loops)

| # | id | Outcome |
|---|-----|---------|
| 11 | contract_handoff | `*/project.md` + `contract/plan.yml` only |
| 12 | run_contract_loop | help/spawn contract loop (bg) |
| 13 | review_contract | `/next` = approve; `/work` may edit `contract/src` |
| 14 | server_handoff | `server/plan.yml` from approved contract |
| 15 | run_server_loop | help/spawn server loop |
| 16 | run_client_and_wait | client append/restarts; `/next` only if plans closed |
| 17 | development_complete | formal end; further hotpatch in packages |

**Contract handoff (11):** fill `project.md` + `contract/plan.yml`; leave server/client plans without work slugs.

**Server handoff (14):** only after stage 13 `/next` (approve). Fill `server/plan.yml` (BC/code + `add_to_client_plan_*`); do not touch `client/plan.yml` or `contract/`.

Skills: SSOT `.agents/skills/`. OpenSpec `/opsx-*` — только в `*/.pi/prompts` при cwd пакета. Пакетные loop — **только Pi**.

Полный операторский процесс: `README.md` § «Агенты, OpenSpec и loop».

## Обязательный JSDoc

- Каждый новый или изменённый класс, конструктор, метод и функция обязан иметь JSDoc.
- Правило распространяется также на именованные arrow-функции; для callback JSDoc ставится перед callback.
- Описание пишется на русском языке, объясняет назначение и не дублирует имя.
- Текст описания без маркеров `/** */` — не более 100 символов.
- Английский JSDoc, отсутствие описания или превышение лимита считаются незавершённой работой.

## Вне scope по умолчанию

Event sourcing, saga, outbox, отдельные read-таблицы и domain services — только по явному запросу.
