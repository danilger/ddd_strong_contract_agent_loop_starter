---
name: domain-drawio-map
description: >-
  Builds a draw.io XML map (.dio) for a bounded context: swimlane nesting,
  green DDD styling, Cursor file links, curved labeled import edges, Contract
  lane with dashed @repo/contract links — as in
  .agents/skills/domain-drawio-map/example.domain-map.dio. Use when the user asks
  to build a domain map, «построить карту домена», «карта домена», a DDD draw.io
  diagram for a module under server/src, or to refresh .dio docs from imports.
disable-model-invocation: false
---

# Domain draw.io map (bounded context)

## Goal

Produce **one** draw.io-compatible XML file (`.dio` or `.drawio`) that mirrors **structure, nesting, and styles** of the bundled reference:

`.agents/skills/domain-drawio-map/example.domain-map.dio` (same folder as this skill; safe to copy into other projects).

Live reference in this repo: `.agents/examples/server/src/user/docs/.dio`.

Do **not** invent a different layout (no alternate grouping, no extra top-level lanes beyond those listed below).

## When to run

Apply this skill when the user (Russian or English) asks to **build / update a domain map** for a server module, e.g.:

- «построить карту домена»
- «карта домена»
- «схема bounded context / модуля»
- «обнови .dio по импортам»

Default target: bounded context root folder, e.g. `server/src/<context>/` (confirm `<context>` from the message or open files).

## Generator (preferred)

Из cwd `server/` (Pi / agent):

```bash
npm run docs:domain-map -- <context>
# например: npm run docs:domain-map -- auth
```

`generate-domain-dio.mjs` принимает произвольный `<context>` и сам резолвит контракт по шаблону `contract/src/**/<context>.contract.ts` (с legacy fallback для исторических контекстов).

Скрипты в этой папке:

| Файл | Назначение |
|------|------------|
| `generate-domain-dio.mjs` | Генерация `server/src/<context>/docs/.dio` |
| `drawio-xml.mjs` | XML-хелперы |
| `check-dio-duplicates.mjs` | Проверка дубликатов `id` в `.dio` |

## Exclusions

- **Do not** add NestJS `*.module.ts` nodes or edges (composition root stays off this diagram), unless the user explicitly requests it.

## Container hierarchy (must match reference)

All inner swimlanes are **children of the same ids and parents** as in `example.domain-map.dio`:

1. **Root** `mxCell id="18"` — outer swimlane, **empty** `value`, `parent="1"`.
2. **Application** `id="11"` — `parent="18"`.
3. Under **Application** (`parent="11"`):
   - **Ports** `id="22"`
   - **Use cases** `id="23"`
   - **Domain** `id="9"`
4. Under **Domain** (`parent="9"`):
   - **Entities** `id="32"`
   - **Value objects** `id="34"`
5. Under **root** `parent="18"` (siblings of Application, **not** inside Application):
   - **Presentation** `id="20"`
   - **Contract** `id="19"` — title `Contract (@repo/contract)`
   - **Infrastructure** `id="21"`

Populate file nodes from existing paths:

| Swimlane   | Scan folder |
|-----------|-------------|
| Entities  | `domain/entities/**/*.ts` |
| Value objects | `domain/value-objects/**/*.ts` |
| Ports     | `application/ports/**/*.ts` |
| Use cases | `application/use-cases/**/*.ts` |
| Presentation | `presentation/**/*.ts` |
| Infrastructure | `infrastructure/adapters/**/*.ts` |
| Contract  | `contract/src/<context>.contract.ts` (monorepo root; one file per bounded context) |

Sort files alphabetically within each swimlane for stable diffs.

## Styling (copy verbatim from reference)

Open **`example.domain-map.dio`** and copy **`style` attributes per swimlane role** (do not invent new colors or flags). At minimum, align with that file for:

- **Root 18** — empty title, `gradientColor=none`, rounded outer swimlane.
- **Application 11** — gray gradient, no `flipH`.
- **Domain 9, Entities 32, Value objects 34, Ports 22, Use cases 23** — same green header + `rounded=1;flipH=1;flipV=0` as in the file.
- **Presentation 20, Contract 19, Infrastructure 21** — rounded, **no** `flipH`.
- **File nodes** (`UserObject` → child `mxCell`): `text;whiteSpace=wrap;html=1;fontSize=25;fontColor=#4D9900;`

**Geometry**: start from the reference file’s positions/sizes; adjust **only** what is needed so swimlanes fit all files (e.g. grow **Use cases** height by ~52px per extra row, **Value objects** by ~52px per extra VO). Keep sibling positions consistent (Presentation left, Contract center-top, Infrastructure right, Application lower block).

## File nodes and Cursor links

For each TypeScript file in the table above:

```xml
<UserObject label="<filename>.ts" link="cursor://file/<ABSOLUTE_PATH_TO_FILE>" id="<uniqueId>">
  <mxCell style="text;whiteSpace=wrap;html=1;fontSize=25;fontColor=#4D9900;" parent="<swimlaneId>" vertex="1">
    <mxGeometry .../>
  </mxCell>
</UserObject>
```

- `label` = basename only (e.g. `create-post.use-case.ts`).
- `link` = `cursor://file/` + **absolute** path to the file in the user’s workspace (derive from the opened project root; on Windows keep `D:\...` style as in the reference).
- Contract file id **41**; contract swimlane id **19**.

Assign **unique** numeric string ids to every `UserObject` / edge. Reuse fixed structural ids (`0,1,9,11,18,19,20,21,22,23,32,34`) exactly; assign new ids for file nodes and edges that do not collide (continue from the next free integer — typically file nodes from `25`, `27+`, `35+`, `37+`, `38+`, `40+`, `41`; edges from `50`).

## Edges (imports)

### Intra-context (relative imports inside `server/src/<context>/`)

- For each pair of diagrammed files **A** imports **B** via a relative path resolvable inside the bounded context root, add an edge.
- **Direction**: **imported → importer** (arrow **from** the file that exports the symbol **to** the file that imports it). Reading the arrow: «откуда импортируем → куда импортируем».
- **Label** (`value` on the edge): comma-separated **imported symbol names** from that import statement (e.g. `User`, `CreateUserUseCase`, `PostRepositoryPort`). If several symbols come from one edge target file, list all (e.g. `userContract, UserDto`).
- Ignore `@nestjs/*`, `drizzle-orm`, `../..` leaving the module, `crypto`, etc.

**Intra-context edge style** (all curved, solid):

```
edgeStyle=entityRelationEdgeStyle;rounded=1;html=1;strokeColor=#4D4D4D;fontColor=#4D4D4D;labelBackgroundColor=none;endArrow=classic;endFill=1;curved=1;
```

### Contract (`@repo/contract`)

- For each diagrammed file that imports from `@repo/contract`, add edge **contract file (`id="41"`) → importer** (dashed arrow from contract to consumer).
- **Label**: imported symbols (e.g. `CreateUserDto`, `UserSchema`, `postContract, PostDto`).
- Same base style as above **plus** dashed line:

```
...;dashed=1;dashPattern=8 8;
```

Do **not** draw edges from consumers back to contract (only **contract → consumer**).

### Edge XML template

```xml
<mxCell id="..." value="ImportedSymbol" style="edgeStyle=entityRelationEdgeStyle;rounded=1;html=1;strokeColor=#4D4D4D;fontColor=#4D4D4D;labelBackgroundColor=none;endArrow=classic;endFill=1;curved=1;" edge="1" parent="1" source="<importedId>" target="<importerId>">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

Add `dashed=1;dashPattern=8 8;` to the style for contract edges only.

## Output

- Write or overwrite: `server/src/<context>/docs/.dio` (create `docs` if missing), unless the user specifies another path.
- Preserve `mxfile` / `mxGraphModel` wrapper and `root` with `mxCell id="0"` and `id="1"` like the reference.

## Quality check

Before finishing:

- [ ] Same swimlane **titles** and **parent chain** as reference (`Application` contains Domain + Ports + Use cases; Presentation / Contract / Infrastructure are only under root).
- [ ] Contract lane with `contract/src/<context>.contract.ts` and dashed labeled edges **to** every consumer (contract → importer).
- [ ] No `*.module.ts` on the canvas.
- [ ] Every shown `.ts` has a working-looking `cursor://file/...` absolute path.
- [ ] Every edge is **curved** (`entityRelationEdgeStyle` + `curved=1`).
- [ ] Every edge has a **label** (`value`) with imported symbol name(s), `fontColor=#4D4D4D` matching the line.
- [ ] Intra-context edges: relative imports only, direction imported → importer (from export source to import consumer).

For edge cases (no `presentation` folder, empty `entities`, no contract consumers), still emit the swimlanes with the same labels and ids; leave them visually minimal (small height) rather than deleting layers.

## После записи domain map

Обязательно синхронизировать strategic context map (из cwd `server/`):

```bash
npm run docs:context-map -- --context <context>
```

(или `npm run docs:context-map` при нескольких BC / полной пересборке)

Обновляет `server/docs/contextMap.dio` и `server/docs/<slug>/domain.md`. Skill: `.agents/skills/context-map-drawio/SKILL.md`. Без отдельного IDE-hook: агент обязан вызвать команду сам (см. `server/AGENTS.md`).

## Additional resources

- [reference.md](reference.md) — bundled `example.domain-map.dio`, edge styles, optional mirrors in `server/src/*/docs/.dio`.
