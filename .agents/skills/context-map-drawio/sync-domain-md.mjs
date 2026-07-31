/**
 * Синхронизация server/docs/<slug>/domain.md
 * Usage (from server/): node ../.agents/skills/context-map-drawio/sync-domain-md.mjs [slug]
 */
import path from 'path';
import { fileURLToPath } from 'url';
import {
  collectCrossBcEventEdges,
  discoverContexts,
  writeDomainMd,
} from './domain-scan.mjs';

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const slugs = discoverContexts();
  if (slugs.length === 0) {
    console.warn('No bounded contexts with docs/.dio found.');
    process.exit(0);
  }
  const filter = process.argv[2];
  const targets = filter ? slugs.filter((s) => s === filter) : slugs;
  if (filter && targets.length === 0) {
    console.error(`Unknown context "${filter}". Available: ${slugs.join(', ')}`);
    process.exit(1);
  }
  const eventEdges = collectCrossBcEventEdges(slugs);
  for (const slug of targets) {
    const out = writeDomainMd(slug, slugs, eventEdges);
    console.log(`Wrote ${out}`);
  }
}

export { writeDomainMd } from './domain-scan.mjs';
