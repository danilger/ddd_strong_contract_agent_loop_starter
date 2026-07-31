# Context map reference

## Files

| Path | Role |
|------|------|
| `server/docs/contextMap.dio` | Live context map |
| `server/docs/<slug>/domain.md` | Per-BC domain doc (manual + AUTO) |
| `.agents/skills/context-map-drawio/example.context-map.dio` | Frozen layout/styles |
| `sync-context-map.mjs` | contextMap.dio + domain.md |
| `sync-domain-md.mjs` | domain.md only |
| `domain-scan.mjs` | Code scan + AUTO merge |
| `domain-md.template.md` | New domain.md skeleton |

## CLI

Из cwd `server/`:

```bash
npm run docs:context-map
npm run docs:context-map -- --context auth
node ../.agents/skills/context-map-drawio/sync-domain-md.mjs account
```

## Structural ids

| id | Role |
|----|------|
| `0`, `1` | mxGraph root |
| `18` | Root swimlane «Context Map» |
| `bc-<slug>` | UserObject wrapper (cursor link → tactical `.dio`) |
| `bc-<slug>-listens` | Listens text node |
| `bc-<slug>-publishes` | Publishes text node |
| `100+` | Event edges |

## BC UserObject link

`cursor://file/<ABS>/server/src/<slug>/docs/.dio` — tactical domain map.

## domain.md AUTO block

Markers: `<!-- AUTO-GENERATED -->` … `<!-- END AUTO-GENERATED -->`

Synced sections: Карты и код, Агрегаты (из кода), Domain events, Commands, Queries.

## Edge wiring

Publisher **Publishes** → subscriber **Listens**, `parent="18"`.

## Excluded slugs

`db`, `health` — `EXCLUDED_SLUGS` in `domain-scan.mjs`.

## После domain-drawio-map

Агент из `server/` вызывает `npm run docs:context-map -- --context <slug>` (см. `server/AGENTS.md`). IDE-hook не используется.

## Related skills

| Skill | Output |
|-------|--------|
| `domain-drawio-map` | `server/src/<slug>/docs/.dio` |
| `context-map-drawio` | `server/docs/contextMap.dio` + `server/docs/<slug>/domain.md` |
