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

## Назначение

- HTTP: методы, path, body, params, responses, `strictStatusCodes: true`.
- Zod-схемы и типы DTO.
- Агрегирующий `apiContract` в `contract/src/index.ts`.

## Что можно

- Новые роутеры в `contract/src/<домен>/<slug>.contract.ts` и подключение в `apiContract`.
- Общие схемы (`ErrorSchema`) — переиспользовать, не дублировать.
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
- Sole writer: `contract/src/**`. Не править `server/` / `client/` из этого контура.

## Новый bounded context

1. `contract/src/<bc_slug>/<slug>.contract.ts` (папка = BC; `shared/` — общие схемы)
2. Экспорт в `contract/src/index.ts` → `apiContract`
3. Только после этого — backend по правилам корневого `AGENTS.md` и `server/AGENTS.md`

## Enforcement

- Не ослаблять валидацию схем, чтобы «протащить» несовместимые payload.
- Не обходить `strictStatusCodes` и явные response-схемы.
- При падении lint/build исправлять контракт и синхронизировать `server`/`client`.
- Финальная проверка после изменений в контракте: из корня `npm run build:contract` (или эквивалент).

## Чеклист

1. ts-rest router + Zod + все статусы ответов?
2. Экспорт из `index.ts`?
3. Сборка контракта после изменений зелёная?
4. Server: DTO только в presentation/infrastructure, не в application handlers?
