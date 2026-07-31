---
name: context-map-drawio
description: >-
  Builds or syncs strategic context map (server/docs/contextMap.dio) and per-BC
  domain docs (server/docs/<slug>/domain.md): swimlanes with Publishes/Listens,
  UserObject links to tactical .dio, event edges. Use for «карта доменов»,
  «context map», after domain-drawio-map or cross-BC @EventsHandler.
disable-model-invocation: false
---

# Context map draw.io (strategic)

## Goal

На каждый sync — **два** артефакта:

| Файл | Содержание |
|------|------------|
| `server/docs/contextMap.dio` | strategic map |
| `server/docs/<slug>/domain.md` | ручные секции + AUTO-блок из кода |

Reference: `.agents/skills/context-map-drawio/example.context-map.dio`.

Tactical map: `server/src/<slug>/docs/.dio` (skill `domain-drawio-map`).

## When to run

- «карта доменов», «context map», «обнови contextMap»
- После нового BC с `docs/.dio`
- После cross-BC `@EventsHandler`
- После `domain-drawio-map` (агент сразу вызывает `docs:context-map`)

## Generator

Из cwd `server/`:

```bash
npm run docs:context-map
npm run docs:context-map -- --context <slug>
```

Скрипты (эта папка):

| Файл | Назначение |
|------|------------|
| `sync-context-map.mjs` | contextMap.dio + вызов domain.md |
| `sync-domain-md.mjs` | только domain.md (опционально) |
| `domain-scan.mjs` | скан кода, merge AUTO-блока |
| `domain-md.template.md` | шаблон нового domain.md |

## Container hierarchy (must match reference)

1. **Root** `mxCell id="18"` — swimlane `Context Map`
2. **BC** `UserObject id="bc-<slug>"` — `label="<slug><br>"`, **link** → tactical `.dio`
3. Внутренний `mxCell` swimlane — **без** `id`/`value`, только style + geometry
4. **Listens** `id="bc-<slug>-listens"`, `parent="bc-<slug>"`, `y=50`
5. **Publishes** `id="bc-<slug>-publishes"`, ниже Listens

## BC node links

```xml
<UserObject label="account&lt;br&gt;" link="cursor://file/<ABS>/server/src/account/docs/.dio" id="bc-account">
  <mxCell style="swimlane;..." parent="18" vertex="1">
    <mxGeometry x="140" y="180" width="210" height="200" as="geometry"/>
  </mxCell>
</UserObject>
```

- **Каждый** BC оборачивается в UserObject (не plain mxCell)
- `link` = `cursor://file/<ABS>/server/src/<slug>/docs/.dio`
- `domain.md` — отдельный файл в `server/docs/<slug>/`, не ссылка на swimlane

## domain.md

Путь: `server/docs/<slug>/domain.md`

- **Ручные** секции — **выше** `<!-- AUTO-GENERATED -->`
- **AUTO-блок** — карты, агрегаты из кода, events, commands, queries; перезаписывается при sync
- При первой миграции без маркеров: ручной текст до `## Domain events` сохраняется, AUTO добавляется снизу

Агент после sync может дописать Назначение / Инварианты вручную.

## Edges (domain events only)

- `bc-<publisher>-publishes` → `bc-<subscriber>-listens`
- `parent="18"`, curved solid `#4D4D4D`

## Discovery

| Что | Источник |
|-----|----------|
| Узлы BC | `server/src/*/docs/.dio` |
| Исключения | `db`, `health` |
| Publishes / Listens / edges | `domain/events`, `event-handlers` |

## Layout

- Root: `x=-350`, `y=-550`, min `1800×650`
- BC: `210×200`, `y=180`; полная пересборка: `x=140` … `x=1360`
- `--context`: сохранить позиции `UserObject id="bc-<slug>"`

## Quality check

- [ ] `contextMap.dio` + `server/docs/<slug>/domain.md` для каждого BC
- [ ] Все BC: UserObject + link на tactical `.dio`
- [ ] Рёбра Publishes → Listens
- [ ] Ручной текст в domain.md не затёрт (вне AUTO-блока)

## После domain-drawio-map

После записи `server/src/<slug>/docs/.dio` агент (cwd `server/`) обязан:

```bash
npm run docs:context-map -- --context <slug>
```

IDE-hook не используется; правило закреплено в `server/AGENTS.md`.

## Additional resources

- [reference.md](reference.md)
