/**
 * Генератор / синхронизатор context map (server/docs/contextMap.dio).
 * Usage:
 *   node ../.agents/skills/context-map-drawio/sync-context-map.mjs              # from server/
 *   node ../.agents/skills/context-map-drawio/sync-context-map.mjs --context auth
 *   npm run docs:context-map -- --context auth                                 # from server/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  collectCrossBcEventEdges,
  collectListenedEvents,
  collectPublishedEvents,
  discoverContexts,
  ROOT,
  writeDomainMd,
} from './domain-scan.mjs';
import {
  contextMapEdge,
  cursorLink,
  escapeXmlAttr,
  nextFreeId,
} from './drawio-xml.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_SRC = path.join(ROOT, 'server', 'src');
const DEFAULT_OUT = path.join(ROOT, 'server', 'docs', 'contextMap.dio');

const SWIMLANE_STYLE =
  'swimlane;startSize=40;rounded=1;strokeColor=#4D9900;fontSize=22;fontColor=#4D9900;gradientColor=none;gradientDirection=south;whiteSpace=wrap;html=1;align=center;';

const CHILD_TEXT_STYLE =
  'text;html=1;align=left;verticalAlign=top;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;';

const NODE_WIDTH = 210;
const NODE_HEIGHT = 200;
const LAYOUT_START_X = 140;
const LAYOUT_START_Y = 180;
const LAYOUT_END_X = 1360;
const ROOT_X = -350;
const ROOT_Y = -550;
const ROOT_MIN_WIDTH = 1800;
const ROOT_MIN_HEIGHT = 650;

function parseArgs(argv) {
  const opts = { context: null, out: DEFAULT_OUT, preserveLayout: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--context' && argv[i + 1]) {
      opts.context = argv[++i];
      opts.preserveLayout = true;
    } else if (argv[i] === '--out' && argv[i + 1]) {
      opts.out = path.resolve(ROOT, argv[++i]);
    }
  }
  return opts;
}

function parseExistingLayout(dioPath) {
  const positions = new Map();
  if (!fs.existsSync(dioPath)) return positions;

  const xml = fs.readFileSync(dioPath, 'utf8');
  const nodeRe =
    /<UserObject[^>]*\bid="bc-([^"]+)"[^>]*>[\s\S]*?<mxGeometry x="([^"]+)" y="([^"]+)"/g;
  let m;
  while ((m = nodeRe.exec(xml)) !== null) {
    const slug = m[1];
    if (slug.includes('-')) continue;
    positions.set(slug, { x: Number(m[2]), y: Number(m[3]) });
  }
  return positions;
}

function defaultLayout(slugs) {
  const positions = new Map();
  if (slugs.length === 0) return positions;
  if (slugs.length === 1) {
    positions.set(slugs[0], { x: LAYOUT_START_X, y: LAYOUT_START_Y });
    return positions;
  }
  const step = (LAYOUT_END_X - LAYOUT_START_X) / (slugs.length - 1);
  slugs.forEach((slug, i) => {
    positions.set(slug, {
      x: Math.round(LAYOUT_START_X + i * step),
      y: LAYOUT_START_Y,
    });
  });
  return positions;
}

function layoutNodes(slugs, existingPositions, preserveLayout) {
  if (!preserveLayout || existingPositions.size === 0) {
    return defaultLayout(slugs);
  }

  const positions = new Map();
  let maxX = LAYOUT_START_X;

  for (const slug of slugs) {
    const pos = existingPositions.get(slug);
    if (pos) {
      positions.set(slug, { ...pos });
      maxX = Math.max(maxX, pos.x + NODE_WIDTH + 80);
    }
  }

  for (const slug of slugs) {
    if (positions.has(slug)) continue;
    positions.set(slug, { x: maxX, y: LAYOUT_START_Y });
    maxX += NODE_WIDTH + 80;
  }

  return positions;
}

function formatEventLines(events) {
  if (events.length === 0) return '';
  return events.join(',<br>');
}

function listensHtml(events) {
  const body = formatEventLines(events);
  return `<span style="color: rgb(77, 153, 0);"><font style="font-size: 12px;"><b>Listens</b>:<br>${body}</font></span>`;
}

function publishesHtml(events) {
  const body = formatEventLines(events);
  return `<span style="color: rgb(77, 153, 0);"><b>Publishes</b>: <br>${body}</span>`;
}

function listensBlockHeight(eventCount) {
  if (eventCount === 0) return 30;
  return 40 + Math.max(0, eventCount - 1) * 15;
}

function contextNode(slug, x, y, publishes, listens) {
  const dioPath = path.join(SERVER_SRC, slug, 'docs', '.dio');
  const link = cursorLink(dioPath);
  const swimlaneId = `bc-${slug}`;
  const listensId = `${swimlaneId}-listens`;
  const publishesId = `${swimlaneId}-publishes`;

  const listensH = listensBlockHeight(listens.length);
  const publishesY = 50 + listensH;
  const publishesH = Math.max(70, 40 + Math.max(0, publishes.length - 1) * 15);

  const listensVal = escapeXmlAttr(listensHtml(listens));
  const publishesVal = escapeXmlAttr(publishesHtml(publishes));

  return `
                <UserObject label="${escapeXmlAttr(slug)}&lt;br&gt;" link="${escapeXmlAttr(link)}" id="${swimlaneId}">
                    <mxCell style="${SWIMLANE_STYLE}" parent="18" vertex="1">
                        <mxGeometry x="${x}" y="${y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" as="geometry"/>
                    </mxCell>
                </UserObject>
                <mxCell id="${listensId}" value="${listensVal}" style="${CHILD_TEXT_STYLE}" parent="${swimlaneId}" vertex="1">
                    <mxGeometry x="10" y="50" width="170" height="${listensH}" as="geometry"/>
                </mxCell>
                <mxCell id="${publishesId}" value="${publishesVal}" style="${CHILD_TEXT_STYLE}" parent="${swimlaneId}" vertex="1">
                    <mxGeometry x="10" y="${publishesY}" width="170" height="${publishesH}" as="geometry"/>
                </mxCell>`;
}

function buildContextMapXml(slugs, positions, eventEdges) {
  let nodes = '';
  let maxRight = ROOT_X + ROOT_MIN_WIDTH;

  for (const slug of slugs) {
    const pos = positions.get(slug);
    const publishes = collectPublishedEvents(slug);
    const listens = collectListenedEvents(slug, slugs);
    nodes += contextNode(slug, pos.x, pos.y, publishes, listens);
    maxRight = Math.max(maxRight, ROOT_X + pos.x + NODE_WIDTH + 140);
  }

  const reservedIds = new Set([
    '0',
    '1',
    '18',
    ...slugs.flatMap((s) => [
      `bc-${s}`,
      `bc-${s}-listens`,
      `bc-${s}-publishes`,
    ]),
  ]);
  const edgeCounter = { value: 100 };
  let edges = '';
  for (const e of eventEdges) {
    if (!slugs.includes(e.publisher) || !slugs.includes(e.subscriber)) continue;
    edges += contextMapEdge(
      nextFreeId(edgeCounter, reservedIds),
      `bc-${e.publisher}-publishes`,
      `bc-${e.subscriber}-listens`,
      e.labels.join(', '),
    );
  }

  const rootWidth = Math.max(ROOT_MIN_WIDTH, maxRight - ROOT_X);
  const rootHeight = ROOT_MIN_HEIGHT;

  return `<mxfile host="65bd71144e">
    <diagram id="context-map" name="Context Map">
        <mxGraphModel dx="2884" dy="2170" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
            <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0"/>
                <mxCell id="18" value="Context Map" style="swimlane;startSize=40;rounded=1;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=none;gradientDirection=south;align=center;" parent="1" vertex="1">
                    <mxGeometry x="${ROOT_X}" y="${ROOT_Y}" width="${rootWidth}" height="${rootHeight}" as="geometry"/>
                </mxCell>${nodes}${edges}
            </root>
        </mxGraphModel>
    </diagram>
</mxfile>
`;
}

export function syncContextMap(options = {}) {
  const out = options.out ?? DEFAULT_OUT;
  const slugs = discoverContexts();

  if (slugs.length === 0) {
    console.warn('No bounded contexts with docs/.dio found.');
    return null;
  }

  if (options.context && !slugs.includes(options.context)) {
    console.error(
      `Context "${options.context}" has no docs/.dio. Available: ${slugs.join(', ')}`,
    );
    process.exit(1);
  }

  const eventEdges = collectCrossBcEventEdges(slugs);
  const domainMdPaths = [];
  for (const slug of slugs) {
    domainMdPaths.push(writeDomainMd(slug, slugs, eventEdges));
  }

  const existingPositions = parseExistingLayout(out);
  const preserveLayout = options.preserveLayout ?? false;
  const positions = layoutNodes(slugs, existingPositions, preserveLayout);
  const xml = buildContextMapXml(slugs, positions, eventEdges);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, xml, 'utf8');
  return { out, slugs, eventEdges, domainMdPaths, xml };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const opts = parseArgs(process.argv);
  const result = syncContextMap(opts);
  if (result) {
    console.log(
      `Wrote ${result.out} (${result.slugs.length} contexts, ${result.eventEdges.length} event edge groups)`,
    );
    console.log(`Wrote ${result.domainMdPaths.length} domain.md file(s)`);
  }
}
