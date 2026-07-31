import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..', '..', '..');
export const SERVER_SRC = path.join(ROOT, 'server', 'src');
export const SERVER_DOCS = path.join(ROOT, 'server', 'docs');

export const EXCLUDED_SLUGS = new Set(['db', 'health']);

export const CONTRACT_BY_CONTEXT = {
  auth: path.join(ROOT, 'contract', 'src', 'auth_account', 'auth.contract.ts'),
  account: path.join(ROOT, 'contract', 'src', 'auth_account', 'account.contract.ts'),
};

const AUTO_START = '<!-- AUTO-GENERATED -->';
const AUTO_END = '<!-- END AUTO-GENERATED -->';

export function listTsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out.sort();
}

export function discoverContexts() {
  if (!fs.existsSync(SERVER_SRC)) return [];
  const slugs = [];
  for (const entry of fs.readdirSync(SERVER_SRC, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    if (EXCLUDED_SLUGS.has(slug)) continue;
    const dioPath = path.join(SERVER_SRC, slug, 'docs', '.dio');
    if (fs.existsSync(dioPath)) slugs.push(slug);
  }
  return slugs.sort();
}

export function eventLabelFromClass(className) {
  return className.replace(/DomainEvent$/, '');
}

export function eventLabelFromFile(filePath) {
  const base = path.basename(filePath, '.domain-event.ts');
  return base
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function collectPublishedEvents(slug) {
  const eventsDir = path.join(SERVER_SRC, slug, 'domain', 'events');
  return listTsFiles(eventsDir).map((f) => eventLabelFromFile(f));
}

export function collectCrossBcEventEdges(knownSlugs) {
  const slugSet = new Set(knownSlugs);
  const pairEvents = new Map();

  const handlers = listTsFiles(SERVER_SRC).filter(
    (f) =>
      f.includes(`${path.sep}application${path.sep}event-handlers${path.sep}`) &&
      f.endsWith('.domain-event.handler.ts'),
  );

  for (const handlerPath of handlers) {
    const rel = path.relative(SERVER_SRC, handlerPath);
    const subscriber = rel.split(path.sep)[0];
    if (!slugSet.has(subscriber)) continue;

    const content = fs.readFileSync(handlerPath, 'utf8');
    const handlerMatch = content.match(/@EventsHandler\((\w+)\)/);
    if (!handlerMatch) continue;
    const eventLabel = eventLabelFromClass(handlerMatch[1]);

    const crossImport =
      /from\s+['"]\.\.\/\.\.\/\.\.\/([^/]+)\/domain\/events\/[^'"]+['"]/.exec(
        content,
      );
    if (!crossImport) continue;

    const publisher = crossImport[1];
    if (!slugSet.has(publisher) || publisher === subscriber) continue;

    const key = `${publisher}->${subscriber}`;
    if (!pairEvents.has(key)) pairEvents.set(key, new Set());
    pairEvents.get(key).add(eventLabel);
  }

  const edges = [];
  for (const [key, labels] of [...pairEvents.entries()].sort()) {
    const [publisher, subscriber] = key.split('->');
    edges.push({
      publisher,
      subscriber,
      labels: [...labels].sort(),
    });
  }
  return edges;
}

export function collectListenedEvents(slug, knownSlugs) {
  const slugSet = new Set(knownSlugs);
  const listened = new Set();
  const handlersDir = path.join(
    SERVER_SRC,
    slug,
    'application',
    'event-handlers',
  );
  for (const handlerPath of listTsFiles(handlersDir)) {
    const content = fs.readFileSync(handlerPath, 'utf8');
    const crossImport =
      /from\s+['"]\.\.\/\.\.\/\.\.\/([^/]+)\/domain\/events\/[^'"]+['"]/.exec(
        content,
      );
    if (!crossImport) continue;
    const publisher = crossImport[1];
    if (!slugSet.has(publisher) || publisher === slug) continue;
    const handlerMatch = content.match(/@EventsHandler\((\w+)\)/);
    if (handlerMatch) listened.add(eventLabelFromClass(handlerMatch[1]));
  }
  return [...listened].sort();
}

function collectInternalEventHandlers(slug) {
  const internal = [];
  const handlersDir = path.join(
    SERVER_SRC,
    slug,
    'application',
    'event-handlers',
  );
  for (const handlerPath of listTsFiles(handlersDir)) {
    const content = fs.readFileSync(handlerPath, 'utf8');
    if (
      /from\s+['"]\.\.\/\.\.\/domain\/events\//.test(content) ||
      /from\s+['"]\.\.\/domain\/events\//.test(content)
    ) {
      const handlerMatch = content.match(/@EventsHandler\((\w+)\)/);
      if (handlerMatch) {
        internal.push(eventLabelFromClass(handlerMatch[1]));
      }
    }
  }
  return [...new Set(internal)].sort();
}

function commandNameFromFile(filePath) {
  return path.basename(filePath, '.command.ts');
}

function queryNameFromFile(filePath) {
  return path.basename(filePath, '.query.ts');
}

function entityNameFromFile(filePath) {
  const base = path.basename(filePath, '.entity.ts');
  return base
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

export function collectAggregates(slug) {
  const dir = path.join(SERVER_SRC, slug, 'domain', 'entities');
  return listTsFiles(dir).map((f) => ({
    name: entityNameFromFile(f),
    file: path.relative(ROOT, f).replace(/\\/g, '/'),
  }));
}

export function collectCommands(slug) {
  const dir = path.join(SERVER_SRC, slug, 'application', 'commands');
  return listTsFiles(dir)
    .filter((f) => f.endsWith('.command.ts') && !f.endsWith('.command.handler.ts'))
    .map((f) => commandNameFromFile(f));
}

export function collectQueries(slug) {
  const dir = path.join(SERVER_SRC, slug, 'application', 'queries');
  return listTsFiles(dir)
    .filter((f) => f.endsWith('.query.ts') && !f.endsWith('.query.handler.ts'))
    .map((f) => queryNameFromFile(f));
}

function relRepoPath(absPath) {
  return path.relative(ROOT, absPath).replace(/\\/g, '/');
}

export function buildAutoSection(slug, slugs, eventEdges) {
  const publishes = collectPublishedEvents(slug);
  const listens = collectListenedEvents(slug, slugs);
  const internal = collectInternalEventHandlers(slug);
  const aggregates = collectAggregates(slug);
  const commands = collectCommands(slug);
  const queries = collectQueries(slug);

  const tacticalDio = relRepoPath(path.join(SERVER_SRC, slug, 'docs', '.dio'));
  const contextMap = relRepoPath(path.join(SERVER_DOCS, 'contextMap.dio'));
  const readme = relRepoPath(path.join(SERVER_SRC, slug, 'README.md'));
  const contract = CONTRACT_BY_CONTEXT[slug]
    ? relRepoPath(CONTRACT_BY_CONTEXT[slug])
    : null;

  const lines = [];
  lines.push('## Карты и код');
  lines.push('');
  lines.push('| Артефакт | Путь |');
  lines.push('|----------|------|');
  lines.push(`| Context map | \`${contextMap}\` |`);
  lines.push(`| Tactical map | \`${tacticalDio}\` |`);
  if (fs.existsSync(path.join(SERVER_SRC, slug, 'README.md'))) {
    lines.push(`| README | \`${readme}\` |`);
  }
  if (contract) {
    lines.push(`| Contract | \`${contract}\` |`);
  }

  if (aggregates.length > 0) {
    lines.push('');
    lines.push('## Агрегаты (из кода)');
    lines.push('');
    lines.push('| Агрегат | Файл |');
    lines.push('|---------|------|');
    for (const a of aggregates) {
      lines.push(`| **${a.name}** | \`${a.file}\` |`);
    }
  }

  lines.push('');
  lines.push('## Domain events');
  lines.push('');
  lines.push('### Публикует');
  lines.push('');
  if (publishes.length === 0) {
    lines.push('—');
  } else {
    for (const e of publishes) {
      lines.push(`- \`${e}\``);
    }
  }

  lines.push('');
  lines.push('### Слушает (cross-BC)');
  lines.push('');
  if (listens.length === 0) {
    lines.push('—');
  } else {
    for (const e of listens) {
      const edge = eventEdges.find(
        (ed) =>
          ed.subscriber === slug &&
          ed.labels.includes(e),
      );
      const from = edge ? edge.publisher : '?';
      lines.push(`- \`${e}\` ← ${from}`);
    }
  }

  if (internal.length > 0) {
    lines.push('');
    lines.push('### Внутренние');
    lines.push('');
    for (const e of internal) {
      lines.push(`- \`${e}\``);
    }
  }

  if (commands.length > 0) {
    lines.push('');
    lines.push('## Commands');
    lines.push('');
    lines.push(commands.map((c) => `\`${c}\``).join(', '));
  }

  if (queries.length > 0) {
    lines.push('');
    lines.push('## Queries');
    lines.push('');
    lines.push(queries.map((q) => `\`${q}\``).join(', '));
  }

  lines.push('');
  lines.push('_Секция синхронизируется `npm run docs:context-map`._');

  return `${AUTO_START}\n${lines.join('\n')}\n${AUTO_END}`;
}

export function domainMdPath(slug) {
  return path.join(SERVER_DOCS, slug, 'domain.md');
}

export function mergeDomainMd(slug, slugs, eventEdges) {
  const outPath = domainMdPath(slug);
  const autoBlock = buildAutoSection(slug, slugs, eventEdges);
  const title = `# ${slug.charAt(0).toUpperCase() + slug.slice(1)} — bounded context`;

  if (!fs.existsSync(outPath)) {
    return `${title}\n\n${autoBlock}\n`;
  }

  const existing = fs.readFileSync(outPath, 'utf8');
  const startIdx = existing.indexOf(AUTO_START);
  const endIdx = existing.indexOf(AUTO_END);

  if (startIdx !== -1 && endIdx !== -1) {
    const manual = existing.slice(0, startIdx).trimEnd();
    const suffix = existing.slice(endIdx + AUTO_END.length).trim();
    const parts = [manual, autoBlock];
    if (suffix) parts.push(suffix);
    return `${parts.join('\n\n')}\n`;
  }

  const manualCut = existing.indexOf('\n## Domain events');
  const manual =
    manualCut !== -1
      ? existing.slice(0, manualCut).trimEnd()
      : existing.trimEnd();

  return `${manual}\n\n${autoBlock}\n`;
}

export function writeDomainMd(slug, slugs, eventEdges) {
  const outPath = domainMdPath(slug);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const content = mergeDomainMd(slug, slugs, eventEdges);
  fs.writeFileSync(outPath, content, 'utf8');
  return outPath;
}
