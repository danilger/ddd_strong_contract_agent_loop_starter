/**
 * Генератор domain map (.dio) по skill domain-drawio-map.
 * Usage:
 *   node ../.agents/skills/domain-drawio-map/generate-domain-dio.mjs <context>   # from server/
 *   npm run docs:domain-map -- auth                                             # from server/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  cursorLink,
  edge,
  fileNode,
  nextFreeId,
} from './drawio-xml.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const SERVER_SRC = path.join(ROOT, 'server', 'src');
const CONTRACT_SRC = path.join(ROOT, 'contract', 'src');

// Legacy contexts where contract lives in a shared folder.
const CONTRACT_BY_CONTEXT = {
  auth: path.join(ROOT, 'contract', 'src', 'auth_account', 'auth.contract.ts'),
  account: path.join(ROOT, 'contract', 'src', 'auth_account', 'account.contract.ts'),
};

const USE_CASE_DIRS = ['commands', 'queries', 'event-handlers'];

function listTsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out.sort();
}

function parseImports(filePath, contextRoot) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  const re =
    /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const symbols = m[1]
      ? m[1]
          .split(',')
          .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
          .filter(Boolean)
      : [m[2]];
    const spec = m[3];
    if (
      spec.startsWith('@nestjs/') ||
      spec.startsWith('drizzle-orm') ||
      spec === 'crypto' ||
      spec === 'bcrypt' ||
      spec === 'rxjs' ||
      spec === 'reflect-metadata'
    ) {
      continue;
    }
    if (spec === '@repo/contract') {
      imports.push({ kind: 'contract', symbols });
      continue;
    }
    if (!spec.startsWith('.')) continue;
    const resolved = path.normalize(
      path.join(path.dirname(filePath), spec),
    );
    const candidates = [
      resolved,
      resolved + '.ts',
      path.join(resolved, 'index.ts'),
    ];
    let target = null;
    for (const c of candidates) {
      if (fs.existsSync(c) && c.startsWith(contextRoot)) {
        target = c;
        break;
      }
    }
    if (target) imports.push({ kind: 'relative', target, symbols });
  }
  return imports;
}

function relLabel(absPath) {
  return path.basename(absPath);
}

function resolveContractPath(context) {
  const legacyPath = CONTRACT_BY_CONTEXT[context];
  if (legacyPath && fs.existsSync(legacyPath)) return legacyPath;

  const expectedBasename = `${context}.contract.ts`;
  let matches = listTsFiles(CONTRACT_SRC).filter(
    (filePath) => path.basename(filePath) === expectedBasename,
  );

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    console.error(
      `Ambiguous contract for context "${context}": ${matches.join(', ')}`,
    );
    process.exit(1);
  }

  const contextDir = path.join(CONTRACT_SRC, context);
  if (fs.existsSync(contextDir)) {
    const inContext = listTsFiles(contextDir).filter((filePath) =>
      filePath.endsWith('.contract.ts'),
    );
    if (inContext.length === 1) return inContext[0];
    if (inContext.length > 1) {
      console.error(
        `Ambiguous contract for context "${context}": ${inContext.join(', ')}`,
      );
      process.exit(1);
    }
  }

  const hyphenBasename = `${context.replace(/_/g, '-')}.contract.ts`;
  matches = listTsFiles(CONTRACT_SRC).filter(
    (filePath) => path.basename(filePath) === hyphenBasename,
  );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    console.error(
      `Ambiguous contract for context "${context}": ${matches.join(', ')}`,
    );
    process.exit(1);
  }

  console.error(
    `Contract file not found for context "${context}". Expected "${expectedBasename}" or *.contract.ts under contract/src/${context}/`,
  );
  process.exit(1);
}

const RESERVED_IDS = new Set([
  '0',
  '1',
  '9',
  '11',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '32',
  '34',
  '41',
]);

function generate(context) {
  const contextRoot = path.join(SERVER_SRC, context);
  const contractPath = resolveContractPath(context);

  const entities = listTsFiles(path.join(contextRoot, 'domain', 'entities'));
  const vos = listTsFiles(path.join(contextRoot, 'domain', 'value-objects'));
  const ports = listTsFiles(path.join(contextRoot, 'application', 'ports'));
  const useCases = USE_CASE_DIRS.flatMap((d) =>
    listTsFiles(path.join(contextRoot, 'application', d)),
  );
  const presentation = listTsFiles(path.join(contextRoot, 'presentation'));
  const infraAdapters = listTsFiles(
    path.join(contextRoot, 'infrastructure', 'adapters'),
  );
  const infraServices = listTsFiles(
    path.join(contextRoot, 'infrastructure', 'services'),
  );
  const infrastructure = [...infraAdapters, ...infraServices].sort();

  const allDiagrammed = [
    ...entities,
    ...vos,
    ...ports,
    ...useCases,
    ...presentation,
    ...infrastructure,
    contractPath,
  ];

  const idByPath = new Map();
  const idCounter = { value: 25 };
  const assignId = (p) => {
    if (!idByPath.has(p)) idByPath.set(p, nextFreeId(idCounter, RESERVED_IDS));
    return idByPath.get(p);
  };

  idByPath.set(contractPath, '41');
  const contractId = '41';

  for (const f of allDiagrammed) {
    if (f !== contractPath) assignId(f);
  }

  const useCaseHeight = Math.max(191, 40 + useCases.length * 52);
  const entitiesHeight = Math.max(155, 55 + entities.length * 52);
  const vosHeight = Math.max(155, 55 + vos.length * 52);
  const portsHeight = Math.max(155, 55 + ports.length * 52);
  const presHeight = Math.max(510, 80 + presentation.length * 52);
  const infraHeight = Math.max(510, 80 + infrastructure.length * 52);
  const appHeight = Math.max(832, 700 + Math.ceil(useCases.length / 3) * 52);

  let entityNodes = '';
  entities.forEach((f, i) => {
    entityNodes += fileNode(
      idByPath.get(f),
      '32',
      relLabel(f),
      cursorLink(f),
      36 + i * 52,
      260,
    );
  });

  let voNodes = '';
  vos.forEach((f, i) => {
    voNodes += fileNode(
      idByPath.get(f),
      '34',
      relLabel(f),
      cursorLink(f),
      20 + i * 52,
      260,
    );
  });

  let portNodes = '';
  ports.forEach((f, i) => {
    portNodes += fileNode(
      idByPath.get(f),
      '22',
      relLabel(f),
      cursorLink(f),
      20 + i * 52,
      250,
    );
  });

  let ucNodes = '';
  useCases.forEach((f, i) => {
    ucNodes += fileNode(
      idByPath.get(f),
      '23',
      relLabel(f),
      cursorLink(f),
      20 + i * 52,
      380,
    );
  });

  let presNodes = '';
  presentation.forEach((f, i) => {
    presNodes += fileNode(
      idByPath.get(f),
      '20',
      relLabel(f),
      cursorLink(f),
      24 + i * 52,
      400,
    );
  });

  let infraNodes = '';
  infrastructure.forEach((f, i) => {
    infraNodes += fileNode(
      idByPath.get(f),
      '21',
      relLabel(f),
      cursorLink(f),
      24 + i * 52,
      480,
    );
  });

  const contractLabel = relLabel(contractPath);

  let edges = '';
  const edgeCounter = { value: Math.max(1000, idCounter.value + 100) };
  const edgeKey = new Set();

  for (const file of allDiagrammed) {
    if (file === contractPath) continue;
    const importerId = idByPath.get(file);
    for (const imp of parseImports(file, contextRoot)) {
      if (imp.kind === 'contract') {
        const key = `c:${contractId}->${importerId}:${imp.symbols.join(',')}`;
        if (edgeKey.has(key)) continue;
        edgeKey.add(key);
        edges += edge(
          nextFreeId(edgeCounter, RESERVED_IDS),
          contractId,
          importerId,
          imp.symbols.join(', '),
          true,
        );
        continue;
      }
      const sourceId = idByPath.get(imp.target);
      if (!sourceId) continue;
      const key = `r:${sourceId}->${importerId}:${imp.symbols.join(',')}`;
      if (edgeKey.has(key)) continue;
      edgeKey.add(key);
      edges += edge(
        nextFreeId(edgeCounter, RESERVED_IDS),
        sourceId,
        importerId,
        imp.symbols.join(', '),
        false,
      );
    }
  }

  const rootHeight = Math.max(1592, appHeight + 800);

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net">
    <diagram id="${context}-domain-map" name="${context}">
        <mxGraphModel dx="1851" dy="1693" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
            <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0"/>
                <mxCell id="18" value="" style="swimlane;startSize=0;rounded=1;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=none;gradientDirection=south;" parent="1" vertex="1">
                    <mxGeometry x="-1123" y="-622" width="2710" height="${rootHeight}" as="geometry"/>
                </mxCell>
                <mxCell id="11" value="Application" style="swimlane;startSize=0;rounded=1;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=#E6E6E6;gradientDirection=south;" parent="18" vertex="1">
                    <mxGeometry x="108" y="650" width="1662" height="${appHeight}" as="geometry"/>
                </mxCell>
                <mxCell id="9" value="Domain" style="swimlane;startSize=0;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=#E6E6E6;gradientDirection=south;rounded=1;flipH=1;flipV=0;" parent="11" vertex="1">
                    <mxGeometry x="416" y="402" width="874" height="${Math.max(entitiesHeight, vosHeight) + 80}" as="geometry"/>
                </mxCell>
                <mxCell id="32" value="Entities" style="swimlane;startSize=0;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=#E6E6E6;gradientDirection=south;rounded=1;flipH=1;flipV=0;" parent="9" vertex="1">
                    <mxGeometry x="28" y="55" width="315" height="${entitiesHeight}" as="geometry"/>
                </mxCell>${entityNodes}
                <mxCell id="34" value="Value objects" style="swimlane;startSize=0;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=#E6E6E6;gradientDirection=south;rounded=1;flipH=1;flipV=0;" parent="9" vertex="1">
                    <mxGeometry x="403" y="55" width="315" height="${vosHeight}" as="geometry"/>
                </mxCell>${voNodes}
                <mxCell id="22" value="Ports" style="swimlane;startSize=0;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=#E6E6E6;gradientDirection=south;rounded=1;flipH=1;flipV=0;" parent="11" vertex="1">
                    <mxGeometry x="39" y="77" width="320" height="${portsHeight}" as="geometry"/>
                </mxCell>${portNodes}
                <mxCell id="23" value="Use cases" style="swimlane;startSize=0;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=#E6E6E6;gradientDirection=south;rounded=1;flipH=1;flipV=0;" parent="11" vertex="1">
                    <mxGeometry x="1140" y="72" width="480" height="${useCaseHeight}" as="geometry"/>
                </mxCell>${ucNodes}
                <mxCell id="20" value="Presentation" style="swimlane;startSize=0;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=#E6E6E6;gradientDirection=south;rounded=1;" parent="18" vertex="1">
                    <mxGeometry x="90" y="50" width="520" height="${presHeight}" as="geometry"/>
                </mxCell>${presNodes}
                <mxCell id="21" value="Infrastructure" style="swimlane;startSize=0;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=#E6E6E6;gradientDirection=south;rounded=1;" parent="18" vertex="1">
                    <mxGeometry x="2065" y="50" width="520" height="${infraHeight}" as="geometry"/>
                </mxCell>${infraNodes}
                <mxCell id="19" value="Contract (@repo/contract)" style="swimlane;startSize=0;strokeColor=#4D9900;fontSize=25;fontColor=#4D9900;gradientColor=#E6E6E6;gradientDirection=south;rounded=1;" parent="18" vertex="1">
                    <mxGeometry x="650" y="50" width="650" height="510" as="geometry"/>
                </mxCell>
                <UserObject label="${contractLabel}" link="${cursorLink(contractPath)}" id="41">
                    <mxCell style="text;whiteSpace=wrap;html=1;fontSize=25;fontColor=#4D9900;" parent="19" vertex="1">
                        <mxGeometry x="20" y="24" width="320" height="52" as="geometry"/>
                    </mxCell>
                </UserObject>${edges}
            </root>
        </mxGraphModel>
    </diagram>
</mxfile>
`;
}

const context = process.argv[2];
if (!context) {
  console.error(
    'Usage: npm run docs:domain-map -- <context>  (from server/)',
  );
  process.exit(1);
}

const outDir = path.join(SERVER_SRC, context, 'docs');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, '.dio');
const xml = generate(context);
fs.writeFileSync(outPath, xml, 'utf8');
console.log(`Wrote ${outPath} (${xml.length} bytes)`);
