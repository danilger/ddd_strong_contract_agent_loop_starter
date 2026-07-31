# Project Architecture

Monorepo: contract-first, тактические DDD + CQRS.
Детали: `contract/AGENTS.md`, `server/AGENTS.md`, `client/AGENTS.md` (FSD v2.1).

## Инварианты

- `@repo/contract` — единая HTTP-граница client ↔ server.
- После изменений в пакете: `npm run check` **из cwd этого пакета** (`server/` / `client/` / …).

## Root agent (Cursor или Pi) — `/start` затем two-phase handoff

Корневой агент **не** реализует фичи в `contract|server|client/src`.

### Strategic Design — `/start`

Перед handoff (новая идея / домен): команда `/start` (Cursor: `.cursor/commands/start.md`; Pi: `.pi/prompts/start.md`). Протокол — skill `ddd-start` (SSOT: `.agents/skills/ddd-start/SKILL.md`).

Этапы confirm-gated пишут только `canon/` (`01_intent` … `08_architecture`, `PROGRESS.md`). Event storming: рекомендации в чате, `.dio` заполняет пользователь; accept | iterate на каждом ревью. До отдельного confirm этапа 10 **не** трогать пакетные `plan.yml` / `project.md`.

### Handoff (две фазы)

После согласованного `canon/` (или если canon уже есть). Протокол — `ddd-start` этапы 10–11; slash `/handoff-server` для фазы 2.

#### 1. Contract handoff (этап 10)

1. Убеждается, что в **каждом пакете** (`contract|server|client`) есть loop-required файлы:
   `project.md`, `plan.yml`, `openspec/config.yaml`, `AGENTS.md`.
   В корне OpenSpec **нет** — root только `/start` + handoff.
2. Заполняет пакетные `project.md` **продуктовым** контекстом (домены, сценарии, ТЗ).
   До handoff они пустые; общие архитектурные правила остаются в `*/AGENTS.md`.
3. Заполняет **только** `contract/plan.yml` slug’ами `*-contract` (или иными согласованными именами).
4. Оставляет `server/plan.yml` **без** рабочих slug (пустой / только `#`).
   **Запрещено** заполнять server-очередь на этой фазе.
5. Оставляет `client/plan.yml` **без** рабочих slug —
   наполняет его только server loop через `add_to_client_plan_*`.

Далее оператор: **contract loop** → human review → **явный approve** контракта.

#### 2. Server handoff (этап 11, `/handoff-server`)

Только после явного approve готового `@repo/contract` («контракт принят» и т.п.):

1. Опирается на `canon/` **и** фактический `contract/src/**` (роуты, статусы, DTO).
2. Заполняет `server/plan.yml` **порядком работы server**, включая моменты выдачи UI:
   - code/BC slug’и (например `create_authorization_bc`);
   - затем `add_to_client_plan_<client-slug>` — отдельный server OpenSpec-change,
     apply которого append’ит `<client-slug>` в `client/plan.yml`.
   **Не** писать `<client-slug>` напрямую строкой в `server/plan.yml`.
3. `client/plan.yml` не трогать; `contract/src` не менять.
4. При необходимости обновить `server/project.md` под утверждённый контракт.

Skills и slash: SSOT skills — `.agents/skills/` (Cursor и Pi). Root-команды — `.cursor/commands/start.md`, `handoff-server.md` и зеркала в `.pi/prompts/`. OpenSpec slash (`/opsx-*`) — только в `*/.pi/prompts` при cwd пакета. Пакетные loop — **только Pi**.

Полный операторский процесс: `README.md` § «Агенты, OpenSpec и loop».

## Обязательный JSDoc

- Каждый новый или изменённый класс, конструктор, метод и функция обязан иметь JSDoc.
- Правило распространяется также на именованные arrow-функции; для callback JSDoc ставится перед callback.
- Описание пишется на русском языке, объясняет назначение и не дублирует имя.
- Текст описания без маркеров `/** */` — не более 100 символов.
- Английский JSDoc, отсутствие описания или превышение лимита считаются незавершённой работой.

## Вне scope по умолчанию

Event sourcing, saga, outbox, отдельные read-таблицы и domain services — только по явному запросу.
