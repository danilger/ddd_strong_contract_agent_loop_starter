# Project Architecture

Monorepo: contract-first, тактические DDD + CQRS.
Детали: `contract/AGENTS.md`, `server/AGENTS.md`, `client/AGENTS.md` (FSD v2.1).

## Инварианты

- `@repo/contract` — единая HTTP-граница client ↔ server.
- После изменений в пакете: `npm run check` **из cwd этого пакета** (`server/` / `client/` / …).

## Root agent (Cursor или Pi) — только handoff

Корневой агент **не** реализует фичи в `contract|server|client/src`.

По задаче он:

1. Убеждается, что в корне и в каждом пакете есть loop-required файлы:
   `project.md`, `plan.yml`, `openspec/config.yaml`, `AGENTS.md`.
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

OpenSpec в корне: Cursor — `.cursor/skills` + `.cursor/commands`; Pi — `.agents/skills`
(walk-up). Пакетные loop — **только Pi**.

Полный операторский процесс: `README.md` § «Агенты, OpenSpec и loop».

## Обязательный JSDoc

- Каждый новый или изменённый класс, конструктор, метод и функция обязан иметь JSDoc.
- Правило распространяется также на именованные arrow-функции; для callback JSDoc ставится перед callback.
- Описание пишется на русском языке, объясняет назначение и не дублирует имя.
- Текст описания без маркеров `/** */` — не более 100 символов.
- Английский JSDoc, отсутствие описания или превышение лимита считаются незавершённой работой.

## Вне scope по умолчанию

Event sourcing, saga, outbox, отдельные read-таблицы и domain services — только по явному запросу.
