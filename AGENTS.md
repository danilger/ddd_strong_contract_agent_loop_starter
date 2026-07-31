# Project Architecture

Monorepo: contract-first, тактические DDD + CQRS.
Детали: `contract/AGENTS.md`, `server/AGENTS.md`, `client/AGENTS.md` (FSD v2.1).

## Инварианты

- `@repo/contract` — единая HTTP-граница client ↔ server.
- После изменений в пакете: `npm run check` **из cwd этого пакета** (`server/` / `client/` / …).

## Root agent (Cursor или Pi) — `/start` затем handoff

Корневой агент **не** реализует фичи в `contract|server|client/src`.

### Strategic Design — `/start`

Перед handoff (новая идея / домен): команда `/start` (Cursor: `.cursor/commands/start.md`; Pi: `.pi/prompts/start.md`). Протокол — skill `ddd-start` (SSOT: `.agents/skills/ddd-start/SKILL.md`).

Этапы confirm-gated пишут только `canon/` (`01_intent` … `08_architecture`, `PROGRESS.md`). Event storming: рекомендации в чате, `.dio` заполняет пользователь; accept | iterate на каждом ревью. До отдельного confirm этапа 10 **не** трогать пакетные `plan.yml` / `project.md`.

### Handoff

После согласованного `canon/` (или если canon уже есть) по задаче агент:

1. Убеждается, что в **каждом пакете** (`contract|server|client`) есть loop-required файлы:
   `project.md`, `plan.yml`, `openspec/config.yaml`, `AGENTS.md`.
   В корне OpenSpec **нет** — root только `/start` + handoff.
2. Заполняет `contract/plan.yml` slug’ами `*-contract` (или иными согласованными именами).
3. Заполняет `server/plan.yml` **порядком работы server**, включая моменты выдачи UI:
   - code/BC slug’и (например `create_authorization_bc`);
   - затем `add_to_client_plan_<client-slug>` — отдельный server OpenSpec-change,
     apply которого append’ит `<client-slug>` в `client/plan.yml`.
   **Не** писать `<client-slug>` напрямую строкой в `server/plan.yml`.
4. Оставляет `client/plan.yml` **без** рабочих slug’ов (пустой / только `#`) —
   наполняет его только server loop через `add_to_client_plan_*`.
5. Заполняет пакетные `project.md` **продуктовым** контекстом (домены, сценарии, ТЗ).
   До handoff они пустые; общие архитектурные правила остаются в `*/AGENTS.md`.
   Пример: [`server/project.md`](server/project.md) ← детали приложения;
   [`server/AGENTS.md`](server/AGENTS.md) ← DDD/CQRS/loop.

Skills и slash: SSOT skills — `.agents/skills/` (Cursor и Pi). Root-команды — `.cursor/commands/start.md` и `.pi/prompts/start.md`. OpenSpec slash (`/opsx-*`) — только в `*/.pi/prompts` при cwd пакета. Пакетные loop — **только Pi**.

Полный операторский процесс: `README.md` § «Агенты, OpenSpec и loop».

## Обязательный JSDoc

- Каждый новый или изменённый класс, конструктор, метод и функция обязан иметь JSDoc.
- Правило распространяется также на именованные arrow-функции; для callback JSDoc ставится перед callback.
- Описание пишется на русском языке, объясняет назначение и не дублирует имя.
- Текст описания без маркеров `/** */` — не более 100 символов.
- Английский JSDoc, отсутствие описания или превышение лимита считаются незавершённой работой.

## Вне scope по умолчанию

Event sourcing, saga, outbox, отдельные read-таблицы и domain services — только по явному запросу.
