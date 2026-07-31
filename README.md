# Starter (contract-first monorepo)

Каркас: `contract/` (`@repo/contract`) · `server/` · `client/` + правила в `AGENTS.md`.

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

Проверка одной версии:

```bash
npm ls zod
npm ls @ts-rest/core @ts-rest/nest
```

Ожидание: одна физическая версия, у соседей `deduped`.

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
| ESLint | запреты пакетов (`@repo/contract`, `drizzle-orm`, `@ts-rest/*`, Nest HTTP) + имена файлов (не `*.service.ts` / use-case) |
| dependency-cruiser | рёбра слоёв: `domain → …`, `application → infrastructure`, `presentation → infrastructure` и т.д. |

Конфиг: `server/.dependency-cruiser.cjs` (путь `src/<bc>/domain|application|infrastructure|presentation`).

### Что проверяет server ESLint

См. `server/eslint.config.mjs`:

- **domain** — нельзя `@repo/contract`, drizzle, `@ts-rest/*`, Nest HTTP, импорты из `application` / `infrastructure` / `presentation`
- **application** — нельзя contract, drizzle, `@ts-rest/*`, `infrastructure` / `presentation`
- **presentation** — нельзя drizzle и прямой `infrastructure` (адаптеры вешаются в `*.module.ts`)
- **check-file** — запрет `*.service.ts`, `*UseCase`, папки `use-cases/` вне каноничных слоёв (hello-scaffold `app.*` временно в ignore)

Направление по канону: `presentation → application → domain`; `infrastructure` реализует порты application и не торчит в presentation напрямую.

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

### Четыре OpenSpec-контура

| Контур | Агент | `projectPath` / cwd | OpenSpec |
|--------|--------|---------------------|----------|
| корень | **Cursor или Pi** | репо | `openspec/` + skills в `.cursor` (Cursor) и `.agents` (Pi) |
| `contract/` | **только Pi** | `…/contract` | `contract/openspec/` |
| `server/` | **только Pi** | `…/server` | `server/openspec/` |
| `client/` | **только Pi** | `…/client` | `client/openspec/` |

Loop (LangGraph в `.agents/loop`) на каждый запуск получает **один** `projectPath` и ждёт там:
`project.md`, `plan.yml`, `openspec/config.yaml`, `AGENTS.md`.

### Pipeline

1. **Root handoff** (Cursor или Pi в корне) — только подготовка планов, без кода фич:
   - заполняет `contract/plan.yml`;
   - заполняет `server/plan.yml` **с учётом готовности эндпоинтов**: code/BC slug’и и
     явные `add_to_client_plan_<client-slug>` (когда после какого server-шага можно кормить client);
   - оставляет `client/plan.yml` **пустым**;
   - заполняет пакетные `project.md` **продуктовым** контекстом (до handoff они пустые).
     Общие правила — в `*/AGENTS.md`; частная логика — в `*/project.md`.
2. **loop@contract** — пишет контракт; review человеком.
3. **loop@server** — исполняет `server/plan.yml` по порядку; **не** invent’ит client-очередь.
   Change `add_to_client_plan_<client-slug>` → append `<client-slug>` в `client/plan.yml`.
4. **loop@client** — стартует, когда в `client/plan.yml` есть ≥1 slug; если план кончился раньше новых append — loop останавливается, оператор **рестартит**.
5. **Hotfix** — Pi с cwd в нужном пакете + локальный openspec.

```text
Root (Cursor|Pi) → contract loop → server loop
                                      │  create_authorization_bc
                                      │  add_to_client_plan_create_auth_ui  ──append──► client/plan.yml
                                      └───────────────────────────────────────────────► client loop
```

### Что в каком `plan.yml`

| Файл | Кто наполняет | Содержимое |
|------|---------------|------------|
| `contract/plan.yml` | root handoff | план контракта (автономен) |
| `server/plan.yml` | root handoff | code/BC slug’и **и** `add_to_client_plan_<client-slug>` |
| `client/plan.yml` | только apply `add_to_client_plan_*` (server loop) | `<client-slug>`; на старте пуст |
| корневой `plan.yml` | обычно пуст | required-files; root-loop не обязателен |

Пример `server/plan.yml` после handoff:

```text
create_authorization_bc
add_to_client_plan_create_auth_ui
```

После выполнения второго change в `client/plan.yml` появляется:

```text
create_auth_ui
```

**Нельзя** писать `create_auth_ui` напрямую в `server/plan.yml` — только как суффикс `add_to_client_plan_…`.

### `add_to_client_plan_*` (server → client)

- Полноценный OpenSpec-change в **server** openspec (propose → apply → archive).
- Apply: **append-only** одна строка `<client-slug>` в конец `client/plan.yml`.
- Не overwrite, не правка существующих строк, не `[x]`.
- Не трогать `client/openspec/**` и `client/src/**`.
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

### Skills

| Где | Для кого |
|-----|----------|
| `.cursor/skills/openspec-*`, `.cursor/commands/opsx-*` | Cursor @ root |
| `.agents/skills/openspec-*` | Pi (walk-up из пакетов и корня) |
| `.agents/skills/domain-drawio-map`, `context-map-drawio` | Pi @ server (карты `.dio`) |
| `.agents/skills/feature-sliced-design` | Pi @ client |

### Check

После кода в пакете — из **этого** пакета: `npm run check` (lint + unit + e2e).  
Server docs: `npm run docs:domain-map -- <slug>`, `npm run docs:context-map -- --context <slug>` (см. `server/AGENTS.md`).

---

## Что пока не в этом README

Auth/user BC, Drizzle, полный OpenSpec development-process из tutor2. Правила кода: корневой и папочные `AGENTS.md`.
