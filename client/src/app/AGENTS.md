# Слой `app/`

Инициализация приложения: то, без чего приложение не стартует.

## Можно

- Providers (theme, query, i18n, auth context wiring).
- Router / route composition (подключение page slices).
- Global styles, fonts.
- App-wide layout shell без бизнес-фич (если не тянет features/entities внутрь shared).

## Сегменты

Организация **по сегментам** (slices на `app` нет): например `providers/`, `styles/`, `routes/`.

## Импорты

Может импортировать всё ниже: `pages`, `widgets`, `features`, `entities`, `shared`.

## Нельзя

- Бизнес-фичи и доменные модели «жить» здесь постоянно — выносить в pages/features/entities по reuse.
- Импортировать из несуществующих верхних слоёв.
