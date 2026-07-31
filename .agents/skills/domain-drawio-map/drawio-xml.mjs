export const EDGE_STYLE =
  'edgeStyle=entityRelationEdgeStyle;rounded=1;html=1;strokeColor=#4D4D4D;fontColor=#4D4D4D;labelBackgroundColor=none;endArrow=classic;endFill=1;curved=1;';

export const DASHED_EDGE_STYLE = EDGE_STYLE + 'dashed=1;dashPattern=8 8;';

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

export function edge(id, source, target, label, dashed = false) {
  const style = dashed ? DASHED_EDGE_STYLE : EDGE_STYLE;
  const val = escapeXmlAttr(label);
  return `
                <mxCell id="${id}" value="${val}" style="${style}" edge="1" parent="1" source="${source}" target="${target}">
                    <mxGeometry relative="1" as="geometry"/>
                </mxCell>`;
}

export function fileNode(id, swimlaneId, label, link, y, width = 280, height = 36) {
  return `
                <UserObject label="${escapeXmlAttr(label)}" link="${escapeXmlAttr(link)}" id="${id}">
                    <mxCell style="text;whiteSpace=wrap;html=1;fontSize=25;fontColor=#4D9900;" parent="${swimlaneId}" vertex="1">
                        <mxGeometry x="20" y="${y}" width="${width}" height="${height}" as="geometry"/>
                    </mxCell>
                </UserObject>`;
}
