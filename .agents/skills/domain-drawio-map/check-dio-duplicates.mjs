/**
 * Проверка дубликатов id в domain map (.dio).
 * Usage (from server/): node ../.agents/skills/domain-drawio-map/check-dio-duplicates.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const SERVER_SRC = path.join(ROOT, 'server', 'src');

function discoverDomainDioFiles() {
  if (!fs.existsSync(SERVER_SRC)) return [];
  const files = [];
  for (const entry of fs.readdirSync(SERVER_SRC, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dio = path.join(SERVER_SRC, entry.name, 'docs', '.dio');
    if (fs.existsSync(dio)) files.push(dio);
  }
  return files.sort();
}

const files = discoverDomainDioFiles();
let hasDups = false;

if (files.length === 0) {
  console.log('No server/src/*/docs/.dio files found.');
  process.exit(0);
}

for (const file of files) {
  const xml = fs.readFileSync(file, 'utf8');
  const ids = [...xml.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const counts = {};
  for (const id of ids) counts[id] = (counts[id] || 0) + 1;
  const dups = Object.entries(counts).filter(([, c]) => c > 1);
  const rel = path.relative(ROOT, file);
  console.log(`${rel}: ${ids.length} ids, ${dups.length} duplicates`);
  if (dups.length) {
    hasDups = true;
    for (const [id, c] of dups) console.log(`  id=${id} x${c}`);
  }
}

process.exit(hasDups ? 1 : 0);
