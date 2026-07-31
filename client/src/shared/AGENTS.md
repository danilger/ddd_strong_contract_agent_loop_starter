# Слой `shared/`

Инфраструктура **без business logic**. Slices нет — только **сегменты**.

## Сегменты (типичные)

| Сегмент | Содержание |
|---------|------------|
| `api/` | `initClient(apiContract)`, typed HTTP, CRUD helpers, DTO re-export из `@repo/contract` |
| `auth/` | tokens, session helpers (не доменные правила) |
| `ui/` | UI kit (MUI wrappers, Button, Modal…) |
| `lib/` | утилиты (formatDate, debounce) без домена |
| `config/` | env, feature flags |
| `i18n/` | настройки локализации (ключи страниц — рядом с UI или в locales layout проекта) |

Сегменты `shared` **могут** импортировать друг друга.

## Public API

Отдельный `index.ts` **на каждый сегмент** (`shared/api/index.ts`, `shared/ui/index.ts`),
не один корневой `shared/index.ts` со всем подряд.

## Contract bridge

- Единая точка клиента: `shared/api` + `@repo/contract`.
- Запрещены параллельные Zod/DTO сущностей контракта.
- Хардкод URL/методов вне контракта — запрещён.

## Нельзя

- Business calculations, feature workflows, entity rules.
- Feature-/entity-specific код «на всякий случай».
- Technical-role dumps: `helpers.ts`, `utils.ts` как свалка доменов.
