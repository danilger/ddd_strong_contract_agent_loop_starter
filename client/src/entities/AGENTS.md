# Слой `entities/`

Переиспользуемые **business domain models** (user, product, …).

## Когда создавать

Только если модель **уже** нужна нескольким pages/features и граница стабильна.
Тонкий клиент часто обходится без entities: типы в `shared/api`, логика в page `model/`.

## Структура

- Slice: `entities/<name>/`.
- Сегменты: `ui`, `model`, `api`, `lib` (осторожно с `ui` — провоцирует cross-imports).
- Public API: `entities/<slice>/index.ts`.

## Импорты

Только `shared/`.
**Запрещён** импорт features/widgets/pages и `entities/a` → `entities/b` напрямую.

Cross-import entities: сначала merge границ; `@x` — last resort (документировать почему).

## Нельзя

- Класть CRUD / API client setup сюда → `shared/api`.
- Auth tokens / login DTO → `shared/auth` или `shared/api`.
- Entity «user» только ради сессии.
- Premature splitting на мелкие entities.
