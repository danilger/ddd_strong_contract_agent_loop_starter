# React Component Diagram — Reference

## Node label HTML

Escape for XML attribute. Component name in orange bold on dark background:

```
&lt;div style=&quot;color: rgb(228, 228, 228); background-color: rgb(24, 24, 24); font-family: Consolas, &amp;quot;Courier New&amp;quot;, monospace; font-size: 14px; line-height: 19px;&quot;&gt;&lt;span style=&quot;color: #efb080;font-weight: bold;&quot;&gt;COMPONENT_NAME&lt;/span&gt;&lt;/div&gt;
```

## Node XML template

Replace `ID`, `LABEL`, `LINK`, `X`, `Y`:

```xml
<UserObject label="LABEL" link="cursor://file/LINK" id="ID">
    <mxCell style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1">
        <mxGeometry x="X" y="Y" width="140" height="50" as="geometry"/>
    </mxCell>
</UserObject>
```

- `LINK`: absolute path with backslashes on Windows, e.g. `D:\projects\myapp\src\pages\FeedPage.tsx`
- `id` on `UserObject` (not inner `mxCell`) is used for edges

## Edge XML template

```xml
<mxCell id="eN" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="PARENT_ID" target="CHILD_ID">
    <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

## File skeleton

```xml
<mxfile host="65bd71144e">
    <diagram id="DIAGRAM_ID" name="Component Tree">
        <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
            <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0"/>
                <!-- nodes -->
                <!-- edges -->
            </root>
        </mxGraphModel>
    </diagram>
</mxfile>
```

Generate `DIAGRAM_ID` as random alphanumeric (e.g. `CI2ik4jLmabBKBr05xS5`) for new diagrams.

## Layout algorithm

Constants: `NODE_W=140`, `NODE_H=50`, `LEVEL_DY=100`, `SIBLING_DX=160`.

1. BFS from root; assign depth level per node.
2. Count nodes per level.
3. For each level `L` with `n` nodes: start `x = (pageWidth - n * SIBLING_DX) / 2`, place left-to-right, `y = 20 + L * LEVEL_DY`.
4. On **update**: skip step 3 for nodes that already have `mxGeometry` in the old file.

## ID assignment

| Element | IDs |
|---------|-----|
| Root cells | `0`, `1` (fixed) |
| First component (root) | `2` |
| Other components | `3`, `4`, … sequential |
| Edges | `e1`, `e2`, … |

When updating, reuse existing ids for unchanged components (match by file path or component name). Assign new ids as `max(existing)+1`.

## Parsing existing .dio (update mode)

Extract from each `UserObject`:

- `id="N"`
- `link="cursor://file/PATH"` → normalize path
- Component name from `&gt;Name&lt;/span&gt;` in label

Extract positions from nested `mxGeometry x="…" y="…"`.

## Route enrichment patterns

Look for:

```tsx
// layout route
{ element: <AppLayout />, children: [...] }

// nested route
{ path: '/feed', element: <ProtectedRoute><FeedPage /></ProtectedRoute> }
```

Map `Outlet` parent layout → each child route's top-level project component(s).

## Excluded import sources (regex)

Skip imports from:

- `react`, `react-dom`, `react-router`, `react-router-dom`
- `@mui/`, `@emotion/`, `notistack`, `awesome-photo-view`, `react-pull-to-refreshify`
- Any path not under project `src/` (or configured source dir)
