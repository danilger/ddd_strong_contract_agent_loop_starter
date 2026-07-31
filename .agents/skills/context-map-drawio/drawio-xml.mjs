export const EDGE_STYLE =
  'edgeStyle=entityRelationEdgeStyle;rounded=1;html=1;strokeColor=#4D4D4D;fontColor=#4D4D4D;labelBackgroundColor=none;endArrow=classic;endFill=1;curved=1;';

export function escapeXmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function cursorLink(absPath) {
  return `cursor://file/${absPath.replace(/\//g, '\\')}`;
}

export function nextFreeId(counter, reservedIds = new Set()) {
  while (reservedIds.has(String(counter.value))) counter.value++;
  const id = String(counter.value);
  counter.value++;
  return id;
}

export function contextMapEdge(id, source, target, label, parentId = '18') {
  const val = escapeXmlAttr(label);
  return `
                <mxCell id="${id}" value="${val}" style="${EDGE_STYLE}" parent="${parentId}" source="${source}" target="${target}" edge="1">
                    <mxGeometry relative="1" as="geometry"/>
                </mxCell>`;
}
