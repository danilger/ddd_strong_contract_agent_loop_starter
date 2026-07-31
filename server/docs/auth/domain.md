# Auth — bounded context

<!-- AUTO-GENERATED -->
## Карты и код

| Артефакт | Путь |
|----------|------|
| Context map | `server/docs/contextMap.dio` |
| Tactical map | `server/src/auth/docs/.dio` |
| Contract | `contract/src/auth_account/auth.contract.ts` |

## Агрегаты (из кода)

| Агрегат | Файл |
|---------|------|
| **Session** | `server/src/auth/domain/entities/session.entity.ts` |
| **User.entity.spec.ts** | `server/src/auth/domain/entities/user.entity.spec.ts` |
| **User** | `server/src/auth/domain/entities/user.entity.ts` |

## Domain events

### Публикует

- `UserRegistered`

### Слушает (cross-BC)

—

### Внутренние

- `UserRegistered`

## Commands

`login`, `logout`, `refresh-session`, `register-user`

## Queries

`get-me`

_Секция синхронизируется `npm run docs:context-map`._
<!-- END AUTO-GENERATED -->
