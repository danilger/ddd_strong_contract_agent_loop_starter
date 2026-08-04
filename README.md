# Starter (contract-first monorepo)

Каркас: `contract/` (`@repo/contract`) · `server/` · `client/` + правила в `AGENTS.md`.

**После клонирования** процесс разработки лучше начинать командой **`/start`** в корне (Cursor или Pi). Она проведёт через onboarding (этап 0), bootstrap install (этап 1) и дальше по [`canon/PROGRESS.md`](canon/PROGRESS.md). Не разносить вручную `npm install` / правки в обход протокола, если цель — полный delivery-флоу. Команды: `/start` · `/work` · `/next` (этапы 0–17). Подробности — § [Агенты, OpenSpec и loop](#агенты-openspec-и-loop).

## npm workspaces — как устроено

```text
корень package.json     ← workspaces + overrides
  contract/             ← @repo/contract
  server/
  client/
package-lock.json       ← одна зафиксированная версия на репо
node_modules/           ← общий hoist (обычно одна копия пакета)
```

**Install только из корня:**

```bash
npm install
```

Не делай отдельный `npm install` внутри `client/` / `server/` / `contract/` как основной поток.

Добавить зависимость в workspace:

```bash
npm install <pkg> -w @repo/contract   # или -w server / -w client
npm install <pkg> -w server -w client # сразу в несколько
```

Проверка одной версии (то же в корневом `npm run check`):

```bash
npm run check:deps
# эквивалент: npm ls zod @ts-rest/core @ts-rest/nest
```

Ожидание: одна физическая версия, у соседей `deduped`. При дублях `npm ls` падает с ненулевым кодом.

---

## Правила общих пакетов (zod, ts-rest, …)

npm **не наследует** deps между workspace. Есть только:

1. **Явное объявление** в каждом пакете, который делает `import`.
2. **Одинаковый range** во всех таких `package.json`.
3. **Корневой `overrides`** — принуждает прямые и транзитивные deps к одной версии.
4. **Lock** — точная версия на диске (`^3.23.8` → может стать `3.25.76`; это нормально для caret).

### Пример: zod

| Где | Зачем |
|-----|--------|
| `contract`, `server`, `client` | везде `import 'zod'` |
| root `overrides.zod` | одна zod на весь граф |

`@ts-rest/core` объявляет zod как **peer** — использует **твою** zod, не отдельную «встроенную» копию. Поэтому важны overrides + один range, а не «оставить zod только у ts-rest».

### Пример: @ts-rest

| Пакет | Где |
|-------|-----|
| `@ts-rest/core` | contract + client + server (одна линия версий) |
| `@ts-rest/nest` | **только** server |

В root `overrides` зафиксированы оба `@ts-rest/*` той же линии, что в workspace.

Stable `@ts-rest/core` ждёт **zod 3** (`^3.22.3+`). Zod 4 — только с осознанным RC ts-rest, не со stable latest.

---

## Быстрый чеклист при добавлении shared-lib

1. Нужен `import` в пакете A? → строка в `A/package.json`.
2. Нужен в A и B? → **один и тот же** range в обоих + в `overrides`.
3. `npm install` из корня → `npm ls <pkg>` без двух разных версий.
4. Меняешь major? → bump везде разом (все workspace + overrides + lock).

---

## Dev / build

```bash
npm run build:contract
npm run dev:server    # Nest → http://localhost:3000
npm run dev:client    # Vite → http://localhost:5173
npm run build:server
npm run build:client
```

Клиент тянет `@repo/contract` через Vite alias на исходники; API base URL — `VITE_API_BASE_URL` (по умолчанию `http://localhost:3000`).

### Auth + SQLite (из коробки)

Живой эталон BC на server: `server/src/auth` + `server/src/db`.

- **Auth** — только identity: register / login / refresh / logout / me. Без ролей.
- **Access** — JWT Bearer; **refresh** — httpOnly cookie `refresh_token` (path `/auth`).
- **DB** — SQLite файл (`DATABASE_PATH` или `server/data/app.sqlite`), Docker не нужен.
- Env: см. [`server/.env.example`](server/.env.example) (`JWT_SECRET`, `DATABASE_PATH`, `PORT`).
- Client: страница Auth (`credentials: 'include'` + access token в памяти).
- Health: `GET /health` → `{ ok: true }`.

```bash
npm run build:contract
npm run dev:server
# POST http://localhost:3000/auth/register { "email":"a@b.c", "password":"password1" }
```

---

## Server: lint и границы DDD

Запуск из `server/` (или `npm run … -w server` из корня):

```bash
npm run lint        # ESLint
npm run lint:arch   # dependency-cruiser
npm run lint:all    # оба
npm run test        # unit (jest)
npm run test:e2e    # API e2e (Playwright HTTP), сам поднимает Nest при необходимости
npm run check       # lint:all + unit + contract build + test:e2e
```

### Зачем dependency-cruiser

ESLint видит **импорты в файле** (`no-restricted-imports`): «этот слой не должен тянуть пакет X / путь Y».  
**dependency-cruiser** строит **граф зависимостей** всего `server/src` и ловит нарушения направления слоёв даже когда путь обходной или алиасный — то, что одним правилом на файл легко пропустить.

Они дополняют друг друга:

| Инструмент | Сильная сторона |
|------------|-----------------|
| ESLint | запреты пакетов (`@repo/contract`, `drizzle-orm`, `@ts-rest/*`) + Nest HTTP **verb**-decorators (`Get`/`Post`/…, не `Controller`) + имена файлов (не `*.service.ts` / use-case) |
| dependency-cruiser | рёбра слоёв: `domain → …`, `application → infrastructure`, `presentation → infrastructure` и т.д. |

Конфиг: `server/.dependency-cruiser.cjs` (путь `src/<bc>/domain|application|infrastructure|presentation`).

### Что проверяет server ESLint

См. `server/eslint.config.mjs`:

- **domain** — нельзя `@repo/contract`, drizzle, `@ts-rest/*`, Nest HTTP, импорты из `application` / `infrastructure` / `presentation`
- **application** — нельзя contract, drizzle, `@ts-rest/*`, `infrastructure` / `presentation`
- **presentation / `*.controller.ts` / `health`** — нельзя drizzle и прямой `infrastructure`; ban импорта Nest `Get|Post|Put|Patch|Delete|All|Head|Options` из `@nestjs/common` (пустой `@Controller()` разрешён для `@TsRestHandler`)
- **check-file** — запрет `*.service.ts`, `*UseCase`, папки `use-cases/` вне каноничных слоёв

Направление по канону: `presentation → application → domain`; `infrastructure` реализует порты application и не торчит в presentation напрямую.

### Осознанные ограничения для агентов

Эти правила специально ужесточены, чтобы генерация кода была предсказуемой:

1. **HTTP SSOT = `contract/`** — маршруты не invent’ятся Nest-ом; server только `@TsRestHandler` на `apiContract`.
2. **ESLint** ловит `@Get`/`@Post`/… на presentation (не ban `Controller` — он нужен ts-rest как оболочка класса).
3. **Loop tool-lock:** при `projectPath` = `server/` или `client/` write/edit/bash **не могут** мутировать sibling `../contract/` (тот же механизм, что readonly `plan.yml`). Sole writer контракта — loop@contract.
4. **Папки BC 1:1** — `contract/src/<bc_slug>` ↔ `server/src/<bc_slug>`.

Цель: меньше drift client/server и меньше «случайных» REST вне контракта при автономных loop.

---

## Client: lint и границы FSD

Запуск из `client/` (или `npm run lint -w client` из корня):

```bash
npm run lint        # oxlint + FSD JS-plugin
npm run test        # unit (vitest)
npm run test:e2e    # UI e2e (Playwright), поднимает server + Vite при необходимости
npm run check       # lint + unit + build contract/server + test:e2e
```

Плагин `@mandujs/oxlint-plugin-fsd` (см. `client/.oxlintrc.json`) проверяет импорты по FSD v2.1:

| Правило | Что ловит |
|---------|-----------|
| `fsd/forbidden-imports` | только вниз по слоям: `app → pages → widgets → features → entities → shared` |
| `fsd/no-cross-slice-dependency` | нет cross-import между slices одного слоя |
| `fsd/no-public-api-sidestep` | снаружи slice — через public API (`index` / сегмент `shared/*`) |
| `fsd/no-relative-imports` | relative не через границы slice (внутри slice — можно) |
| `fsd/no-ui-in-business-logic` | `model` / `api` / `lib` не тянут `ui` |
| `fsd/no-global-store-imports` | нет прямых импортов глобального store |
| `fsd/ordered-imports` | порядок групп импортов по слоям (warn) |

Alias: `@/…` (`withSlash: true`), как в Vite/tsconfig.

---

## Агенты, OpenSpec и loop

Краткая «карта», чтобы быстро вспомнить, как устроен процесс.

### Контуры

| Контур | Агент | cwd / `projectPath` | Что делает |
|--------|--------|---------------------|------------|
| **корень** | Cursor или Pi | репо | `/start` · `/work` · `/next` → `canon/PROGRESS` этапы 0–17. **Без** OpenSpec |

| `contract/` | **только Pi** | `…/contract` | OpenSpec + loop по `contract/plan.yml` |
| `server/` | **только Pi** | `…/server` | OpenSpec + loop по `server/plan.yml` |
| `client/` | **только Pi** | `…/client` | OpenSpec + loop по `client/plan.yml` |

Loop (LangGraph в `.agents/loop`) на каждый запуск получает **один** `projectPath` = каталог пакета и ждёт там:
`project.md`, `plan.yml`, `openspec/config.yaml`, `AGENTS.md`. Root-loop не используется.

### Skills и команды (где что лежит)

Цель: одинаковый смысл в Cursor и Pi, минимум дублей.

```text
.agents/skills/                 # SSOT всех skills (Cursor + Pi walk-up)
  ddd-start/                    # протокол /start · /work · /next (этапы 0–17)
  openspec-*/                   # OpenSpec skills для Pi@package
  domain-drawio-map/
  context-map-drawio/
  feature-sliced-design/
  react-component-diagram/      # client: npm run docs:component-tree

.cursor/commands/start.md|work.md|next.md
.pi/prompts/start.md|work.md|next.md

contract|server|client/
  openspec/                     # контур OpenSpec пакета
  .pi/prompts/opsx-*.md         # Pi slash /opsx-* (только при cwd=пакет)
```

**Нет:** корневого `openspec/`, `.cursor/skills/`, `.pi/skills/`, `*/.pi/skills/` (skills только в `.agents`).

| Роль | Cursor | Pi |
|------|--------|-----|
| Start / resume | `/start` | `/start` |
| Stage work | `/work` | `/work` |
| Accept & advance | `/next` | `/next` |
| OpenSpec propose/apply/… | — (не в корне) | cwd пакета + `/opsx-*`; skills из `.agents` (walk-up) |

Неизбежный дубль платформ: launcher’ы `/start` `/work` `/next` (Cursor command ≠ Pi prompt). Протокол один — `ddd-start`.

Тройной `opsx-*` в `contract|server|client/.pi/prompts` остаётся: Pi не читает prompts из `.agents`, loop идёт с cwd пакета.

### Pipeline (`/start` · `/work` · `/next`)

**Инвариант:** `server/plan.yml` заполняется на этапе 14 после `/next` с этапа 13 (approve контракта). `client/plan.yml` — только через server `add-to-client-plan-*` (append). Все slug — **kebab-case** (без `_`); иначе loop падает при чтении plan.

Команды: skill `ddd-start`; прогресс — `canon/PROGRESS.md` (статусы `pending|in_progress|waiting_user|done`).

| # | Stage | Что происходит |
|---|--------|----------------|
| 0 | onboarding | кратко: команды + карта этапов; `/next` = понял |
| 1 | bootstrap | root `npm install`, `server/.env`, `build:contract`, loop deps |
| 2–10 | canon | intent → … → architecture (`/work` правки, `/next` принять) |
| 11 | contract_handoff | `*/project.md` + только `contract/plan.yml` |
| 12 | run_contract_loop | help/spawn contract loop (bg); не ждать конца |
| 13 | review_contract | review; `/work` может править `contract/src`; `/next` = approve |
| 14 | server_handoff | заполнить `server/plan.yml` |
| 15 | run_server_loop | help/spawn server loop |
| 16 | run_client_and_wait | client по append + рестарты; `/next` только если оба plan закрыты |
| 17 | development_complete | формально done; дальше hotpatch в пакетах |

```text
/start → 0 onboarding → 1 bootstrap → stages 2–10 (canon)
       ──/next──► 11 contract handoff ──/next──► 12 contract loop
                                                      │
                                                      ▼
                                             13 review (/next=approve)
                                                      │
                                                      ▼
                                             14 server plan → 15 server loop
                                                      │  add-to-client-plan-… ──append──► client/plan.yml
                                                      ▼
                                             16 client loop (+ restarts) ──gate──/next──► 17 done
```

**Stage 16 gate перед `/next`:** нет рабочих slug в `server/plan.yml` и `client/plan.yml`; нет active `openspec/changes` в server/client. Иначе `/next` отклоняется.

### Что в каком `plan.yml`

| Файл | Кто наполняет | Содержимое |
|------|---------------|------------|
| `contract/plan.yml` | этап 11 (contract_handoff) | kebab slug’и `*-contract` |
| `server/plan.yml` | этап 14 (server_handoff) после approve на 13 | code/BC slug’и **и** `add-to-client-plan-<client-slug>` |
| `client/plan.yml` | только apply `add-to-client-plan-*` (server loop) | `<client-slug>`; на старте пуст |

Расшифровка каждого slug — в секции `## Очередь (plan.yml)` того же пакета `project.md` (`### <slug>` 1:1 со строкой plan). `plan.yml` остаётся тонкой очередью.

Пример `server/plan.yml` **после этапа 14** (не после contract handoff):

```text
extend-auth-bc-with-roles
add-to-client-plan-create-auth-ui
```

После выполнения второго change в `client/plan.yml` появляется:

```text
create-auth-ui
```

**Нельзя** писать `create-auth-ui` напрямую в `server/plan.yml` — только как суффикс `add-to-client-plan-…`.
**Нельзя** заполнять `server/plan.yml` до `/next` с этапа 13 (approve контракта).
**Нельзя** использовать `_` в slug (OpenSpec/loop ждут kebab).

### `add-to-client-plan-*` (server → client)

- Полноценный OpenSpec-change в **server** openspec (propose → apply → archive).
- Apply: **append-only** одна строка `<client-slug>` в конец `client/plan.yml`.
- Не overwrite, не правка существующих строк, не `[x]`.
- Не трогать `client/openspec/**` и `client/src/**`.
- BC/code change **не** пишет в `client/plan.yml`.
- Client-агент **никогда** не пишет свой `plan.yml` (прогресс = archive).

### Запуск loop

Из каталога `.agents/loop` (см. `.agents/loop/README.md`):

```bash
cd .agents/loop
npm install   # один раз
npm run cli -- "D:/projects/ddd_strong_contract_agent_loop_starter/contract"
npm run cli -- "D:/projects/ddd_strong_contract_agent_loop_starter/server"
npm run cli -- "D:/projects/ddd_strong_contract_agent_loop_starter/client"
```

Или Studio: `npm run dev` в `.agents/loop`, input `{ "projectPath": "<abs>" }`.

**Tool-lock:** `plan.yml` всегда readonly для Pi; для `server`/`client` дополнительно readonly весь sibling `../contract/` (правки контракта — только через loop@contract).

### Check

Из **корня** (deps + server + client):

```bash
npm run check
# = check:deps (zod / @ts-rest/*) → check -w server → check -w client
```

Только dedupe shared-пакетов: `npm run check:deps`.

После кода в одном пакете — из **этого** пакета: `npm run check` (lint + unit + e2e).  
Server docs: `npm run docs:domain-map -- <slug>`, `npm run docs:context-map -- --context <slug>` (см. `server/AGENTS.md`).

---

## Что пока не в этом README

Полный OpenSpec development-process из tutor2 (propose/apply cookbook сверх текущего pipeline). Правила кода: корневой и папочные `AGENTS.md`.
