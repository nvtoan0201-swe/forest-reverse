#!/usr/bin/env node
/**
 * verify-assets.mjs — checks that generated placeholder assets cover the catalog.
 * Usage: node scripts/verify-assets.mjs [--mode=release]
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const trees = JSON.parse(readFileSync(join(root, 'src/assets/catalog/tree-types.json'), 'utf8'));
const sounds = JSON.parse(readFileSync(join(root, 'src/assets/catalog/ambient-sounds.json'), 'utf8'));
const release = process.argv.includes('--mode=release');

const problems = [];
for (const t of trees) {
  for (const required of ['product', 'phase_1', 'phase_2', 'phase_3', 'phase_4', 'dead']) {
    const svg = join(root, `public/assets/trees/${t.gid}/${required}.svg`);
    const webp = join(root, `public/assets/trees/${t.gid}/${required}.webp`);
    const png = join(root, `public/assets/trees/${t.gid}/${required}.png`);
    if (!existsSync(svg) && !existsSync(webp) && !existsSync(png)) {
      problems.push(`missing trees/${t.gid}/${required}.*`);
    }
    if (release && existsSync(webp)) {
      problems.push(`release build must not contain original webp: trees/${t.gid}/${required}.webp`);
    }
  }
}
for (const s of sounds) {
  const wav = join(root, `public/assets/sounds/ambient/${s.gid}.wav`);
  const ogg = join(root, `public/assets/sounds/ambient/${s.gid}.ogg`);
  if (!existsSync(wav) && !existsSync(ogg)) problems.push(`missing sounds/ambient/${s.gid}.*`);
}
for (const sfx of ['click', 'slide', 'tree0', 'tree1', 'tree2', 'ring']) {
  const exists =
    existsSync(join(root, `public/assets/sounds/sfx/${sfx}.wav`)) ||
    existsSync(join(root, `public/assets/sounds/sfx/${sfx}.ogg`));
  if (!exists) problems.push(`missing sounds/sfx/${sfx}.*`);
}

if (problems.length) {
  console.error(`verify-assets: ${problems.length} problem(s)`);
  for (const p of problems.slice(0, 40)) console.error(`  - ${p}`);
  console.error('Run: npm run assets');
  process.exit(1);
}
console.log(`verify-assets: OK (${trees.length} species, ${sounds.length} sounds)`);
