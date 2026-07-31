# Слой `features/`

Переиспользуемые **user actions** (действия с бизнес-ценностью для пользователя).

## Когда создавать

Только если взаимодействие **уже** используется на 2+ pages и граница ясна.
Один page → оставить в `pages/<slice>/`.

## Структура

- Slice: `features/<action-name>/` (например `auth-login`, `add-to-cart`).
- Сегменты: `ui`, `model`, `api`, `lib`, `config`.
- Public API: `features/<slice>/index.ts`.

## Импорты

Только ниже: `entities`, `shared`.
**Запрещён** `features/a` → `features/b`.

При необходимости связать два feature — compose в `pages`/`app` (IoC), merge slices,
или вынести общее в `entities` / `shared` (см. skill § Cross-Import Resolution).

## Нельзя

- Speculative features «на будущее».
- CRUD-инфраструктуру вместо user action (CRUD → `shared/api`).
- Импорт внутренних файлов slice в обход `index.ts`.
- `@x` notation — только для entities, не для features.
