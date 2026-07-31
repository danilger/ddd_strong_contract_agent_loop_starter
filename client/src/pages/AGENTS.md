# Слой `pages/`

Route-level composition. **Сюда кладётся новый код по умолчанию** (pages first).

## Структура

- Каждый route (или крупная часть nested route) — **slice**: `pages/<slice-name>/`.
- Внутри slice — сегменты `ui` / `api` / `model` / `lib` / `config` по необходимости.
- Public API: `pages/<slice>/index.ts`.

## Можно

- Page UI, page-specific forms, validation, fetch, local state.
- Крупные UI-блоки, используемые только на этой странице.
- Дублирование между pages допустимо, пока extract не оправдан.

## Импорты

Только ниже: `widgets`, `features`, `entities`, `shared`.
**Запрещён** импорт из другой page slice.

## Extract вниз

Только если тот же код **уже** используется на 2+ pages и граница стабильна:
- user action → `features/`
- domain model → `entities/`
- чистый UI / infra → `shared/`

## Нельзя

- Cross-import `pages/a` → `pages/b`.
- Импорт внутренних файлов чужого slice в обход `index.ts`.
