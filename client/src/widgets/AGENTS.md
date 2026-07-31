# Слой `widgets/`

**Discouraged для нового кода** (FSD v2.1 skill).

UI-блоки часто содержат fetch/state/event flow → граница с `features` размывается.
Слой оставлен в скелете стартера для совместимости; **не создавать новые widgets по умолчанию**.

## Куда класть вместо widget

| Что | Куда |
|-----|------|
| UI только этой страницы | `pages/<slice>/ui` |
| User action + UI, reuse на 2+ pages | `features/<slice>` |
| Чистый UI без бизнеса | `shared/ui` |
| App-wide layout shell | `app/` |

## Если widget всё же есть (legacy)

- Slice + сегменты + `index.ts`.
- Импорты только вниз: `features`, `entities`, `shared`.
- Без cross-import между widgets.

## Нельзя

- Активно заводить `widgets/` «для каждой карточки».
- Тянуть widgets из `features` / `entities` вверх.
