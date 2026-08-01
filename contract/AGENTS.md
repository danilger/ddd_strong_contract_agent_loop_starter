# Разработка в `contract/`

`contract/` — пакет `@repo/contract`: **единственный источник HTTP-контракта** для `server/` и `client/`.
Это **contract-first** слой: описывает API, не доменную модель.

## Контекст конкретного приложения

Общие правила контракта — в этом файле.
Поверхности API / домены этой задачи — в [`project.md`](./project.md) (root handoff; до того пуст).

## Роль в архитектуре

```text
contract (Zod + ts-rest)  →  presentation adapters  →  commands/queries  →  domain
                         ↘  infrastructure (safeParse, IsExact в schema.ts)
                         ↘  client (initClient(apiContract))
```

Контракт **не заменяет** domain: DTO ≠ Aggregate, DTO ≠ Command.
Сервер маппит DTO → Command в `presentation/*-command.adapter.ts`.

## Раскладка папок (= BC)

```text
contract/src/
  shared/              # только cross-BC схемы (ErrorSchema, pagination) — НЕ BC
  health/              # platform surface (исключение, зеркало server/src/health/)
  <bc_slug>/           # 1:1 с server/src/<bc_slug>/ и canon/04_bounded_contexts.md
    <bc_slug>.contract.ts
    <bc_slug>.schemas.ts   # optional
```

- Имя папки BC = тот же slug, что на server и в canon.
- Один BC — одна папка; несколько роутеров BC — файлы внутри неё, не соседние папки.
- Business endpoints **не** класть в `shared/`.

## Назначение

- HTTP: методы, path, body, params, responses, `strictStatusCodes: true`.
- Zod-схемы и типы DTO.
- Агрегирующий `apiContract` в `contract/src/index.ts`.

## Что можно

- Новые роутеры в `contract/src/<bc_slug>/<bc_slug>.contract.ts` и подключение в `apiContract`.
- Общие схемы (`ErrorSchema`) — в `shared/`, не дублировать.
- Явные коды ответов со схемами для каждого статуса.

## Запрещено

- NestJS, Drizzle, CQRS, handlers, repositories, domain logic.
- Дублировать контрактные типы в `server/` или `client/` вместо `@repo/contract`.
- Endpoint без Zod для body/params/responses.
- Менять контракт без синхронизации server + client + `db/schema.ts` (если затронута форма сущности).

## Связь с БД

Форма entity-схем должна совпадать с row в `server/src/db/schema.ts` (`IsExact`).
При изменении полей сущности в API — обновить контракт, schema, миграцию.

## Loop / Pi

- Агент в этом каталоге: **только Pi** (и loop с `projectPath` = `contract/`).
- `plan.yml` автономен: slug’и `*-contract`, без зависимости от server/client plans.
  Наполняет root на **этапе 11 (contract_handoff)**; `server/plan.yml` на этой фазе не пишется.
- **Writers `contract/**`:** contract loop; root на **этапе 13** (`review_contract`) для правок после review.
  Server/client loops жёстко заблокированы tool-lock’ом на `../contract/`.
  Не править `server/` / `client/` из этого контура.
- После contract loop: этап 13 — review; **`/next` = approve**. Затем этап 14 заполняет `server/plan.yml`.

## Новый bounded context

1. `contract/src/<bc_slug>/<bc_slug>.contract.ts` (+ schemas при необходимости)
2. Экспорт в `contract/src/index.ts` → `apiContract`
3. Только после approve контракта — backend в `server/src/<bc_slug>/` по `server/AGENTS.md`

## Enforcement

- Не ослаблять валидацию схем, чтобы «протащить» несовместимые payload.
- Не обходить `strictStatusCodes` и явные response-схемы.
- При падении lint/build исправлять контракт и синхронизировать `server`/`client`.
- Финальная проверка после изменений в контракте: из корня `npm run build:contract` (или эквивалент).

## Чеклист

1. ts-rest router + Zod + все статусы ответов?
2. Папка = BC slug (или `shared` / `health`)?
3. Экспорт из `index.ts`?
4. Сборка контракта после изменений зелёная?
5. Server: DTO только в presentation/infrastructure, не в application handlers?
