# Модуль `user` (DDD)

Направление зависимостей:

- `domain/` — сущности и value objects (без Nest и HTTP).
- `application/` — сценарии (use case-ы) и **порты** (`UserRepositoryPort`).
- `infrastructure/` — адаптеры к портам (`DrizzleUserRepositoryAdapter`, при необходимости in-memory).
- `presentation/` — вход HTTP (`UserController`), только маппинг в DTO контракта.

Контракт API и DTO:

- Пакет `@repo/contract` в корне монорепозитория (`contract/`) — единый Zod + ts-rest контракт для backend и frontend.

Поток:

1. Описать/изменить эндпоинт в `contract/src/user.contract.ts`.
2. Синхронно обновить домен/сценарии при смене правил.
3. Обновить `server/src/db/schema.ts` и миграции Drizzle, чтобы строка БД оставалась согласованной с `UserSchema` (см. `IsExact` в `schema.ts`).
