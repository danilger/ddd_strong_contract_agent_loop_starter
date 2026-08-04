# Разработка в `client/`

Клиент — **Feature-Sliced Design (FSD) v2.1** + **contract-first** потребитель `@repo/contract`.
UI не описывает API самостоятельно.

## Контекст конкретного приложения

Общие правила FSD/contract-bridge — в этом файле.
Продуктовые детали UI/сценариев — в [`project.md`](./project.md) (заполняет root при contract handoff; до того пуст).

Детали методологии on-demand: skill `feature-sliced-design`
(`.agents/skills/feature-sliced-design/`, `/skill:feature-sliced-design`).
Источник: [fsd.how](https://fsd.how) / [Docs for LLMs](https://fsd.how/docs/llms/).

Слойные правила: `src/app/`, `src/pages/`, `src/widgets/`, `src/features/`,
`src/entities/`, `src/shared/` — каждый со своим `AGENTS.md`.

Папки слоёв — скелет стартера. Код класть в слой **только** по decision framework ниже, не размазывать заранее.

## Слои (сверху вниз)

```text
src/app/       → инициализация, providers, routing, theme, global styles
src/pages/     → route-level composition; код страницы по умолчанию здесь
src/widgets/   → discouraged для нового кода (см. widgets/AGENTS.md)
src/features/  → переиспользуемые user actions (только при реальном multi-use)
src/entities/  → переиспользуемые business models (только при реальном multi-use)
src/shared/    → инфраструктура без business logic (UI kit, api client, utils)
```

- `processes/` — **deprecated**, не использовать.
- Минимально валидный FSD: `app` + `pages` + `shared`.

## MUST (архитектура)

1. **Import only downward:** `app → pages → widgets → features → entities → shared`.
   Upward и cross-import между slices одного слоя — запрещены.
2. **Public API:** снаружи slice только через `index.ts`.
   В `shared/` — public API **на сегмент** (`shared/ui`, `shared/api`, …), не один barrel на весь shared.
3. **Pages first:** новый код — в page slice. Extract вниз только если тот же код
   **уже** используется в 2+ местах и граница стабильна (не гипотетический reuse).
4. **Сегменты:** `ui` / `model` / `api` / `lib` / `config`.
5. **Имена файлов:** domain-based (`user.ts`, `fetch-profile.ts`), не `types.ts` / `utils.ts`.
6. **Shared без business logic.** CRUD и API client — в `shared/api`.

```typescript
// ✅
import { Button } from "@/shared/ui";
import { useUser } from "@/entities/user";

// ❌
import { login } from "@/features/auth"; // из entities вверх
import { X } from "@/features/a/ui/X";   // мимо public API
import { Y } from "@/features/b";        // features → features
```

## Contract bridge (проектный MUST)

- Типы и маршруты — только из `@repo/contract`.
- `initClient(apiContract, { baseUrl })` — в `shared/api` (единая точка HTTP-клиента).
- Вызовы API — через typed client из `shared/api`, не хардкод URL/методов.
- Изменение API — сначала `contract/`, затем UI.
- Запрещены локальные интерфейсы/Zod-схемы сущностей, уже описанных в контракте.
- Server domain/CQRS на клиент **не протекает** (нет Command, Aggregate, ReadModel) —
  только DTO и статусы ts-rest.

Анализ: `shared/api` → `contract/src/**/*.contract.ts` → `contract/dist/*.d.ts`.

## UI стек

- UI kit: MUI v6 (`shared/ui` и выше по правилам слоёв).
- Client state: Zustand (обычно `model` slice или `shared` для auth/locale flags).
- Формы: React Hook Form + Zod (`@hookform/resolvers/zod`).
- i18n: i18next (`t('key')`); строки без ключа запрещены.
- Таблицы list API: `TableFeature` + `makeTableQuery`; ответ `{ data, pagination }`;
  схемы `TableControlQuerySchema`, `paginatedListSchema` из `@repo/contract`.
- Rich text: TipTap.
- Другой UI kit — только по явному согласованию.

## Запрещено

- Кэшировать server state только в Zustand вместо typed API-запросов.
- Создавать entities/features «на будущее» (insignificant slice).
- Класть CRUD и auth tokens в entities — это `shared/api` / `shared/auth`.
- Активно плодить `widgets/` (см. `widgets/AGENTS.md`).

## Loop / Pi

- Агент: **только Pi** (loop `projectPath` = `client/`).
- `plan.yml` на старте пуст; наполняется **только** через server-change `add-to-client-plan-*` (append),
  после **server-handoff** (этап 14) и apply соответствующих server changes — не раньше.
  Slug’и — kebab-case only.
- Scope текущего change: блок `### <slug>` в `## Очередь (plan.yml)` в [`project.md`](./project.md) (когда секция есть).
- **Запрещено** писать в `plan.yml`, `contract/**`, `server/**`.
  Tool-lock loop отказывает write/edit/bash в `../contract/` (как readonly `plan.yml`).
- Прогресс = `openspec/changes` (active/archive). Если plan опустел — loop стоп; после новых строк — рестарт.

## Component tree (draw.io)

После **создания или изменения** project React-компонентов в `src/` — актуализировать дерево (cwd = `client/`):

```bash
npm run docs:component-tree
```

- Output: `docs/component-tree.dio` (root = `src/app/App.tsx`).
- Skill: `.agents/skills/react-component-diagram` (`/skill:react-component-diagram`).
- **Запрещено** спрашивать пользователя root/path/mode или ждать confirm — только скрипт с defaults.
- Устаревшее дерево после UI-изменений — незавершённая работа.

## Enforcement

- После client-изменений: `npm run check` (из `client/`).
- При lint/build ошибках править код, не обходить правила.

## Чеклист

1. Импорты только вниз по слоям; нет same-layer cross-import?
2. Внешние импорты slice только через `index.ts`?
3. Новый код в page, extract только при реальном reuse?
4. API через `shared/api` + `@repo/contract`, без дублей DTO?
5. i18n-ключи на пользовательских строках?
6. Обработаны статусы ошибок контракта (404, 409, …)?
7. `plan.yml` не редактировался этим агентом?
8. `docs/component-tree.dio` обновлён (`npm run docs:component-tree`), если менялись UI-компоненты?
9. `npm run check` зелёный?
