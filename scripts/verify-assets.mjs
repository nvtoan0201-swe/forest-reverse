#!/usr/bin/env node
/**
 * verify-assets.mjs — checks generated assets against the catalog.
 *
 * Usage:
 *   node scripts/verify-assets.mjs [--mode=placeholder|original|release]
 *
 * - placeholder (default): placeholder tree/sound catalog + bundled fonts.
 * - original: full original-mode inventory (trees, frames, sounds, fonts, icons).
 * - release: fails if any local-only asset directory exists.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = join(root, '..');
const modeArg = process.argv.find((a) => a.startsWith('--mode='));
const mode = (modeArg?.split('=')[1] ?? 'placeholder').trim();
const quiet = process.argv.includes('--quiet');

const trees = JSON.parse(readFileSync(join(root, 'src/assets/catalog/tree-types.json'), 'utf8'));
const sounds = JSON.parse(readFileSync(join(root, 'src/assets/catalog/ambient-sounds.json'), 'utf8'));
const iconMap = JSON.parse(readFileSync(join(root, 'src/assets/catalog/icon-map.generated.json'), 'utf8'));

const problems = [];
const note = (p) => problems.push(p);

const DENSITY_VALUES = ['xxhdpi', 'xhdpi', 'hdpi', 'mdpi', 'ldpi'];
const PHASE_TARGETS = { dead: 'dead', product: 'product', launch: 'launch' };
function phaseTarget(key) {
  if (PHASE_TARGETS[key]) return PHASE_TARGETS[key];
  const m = key.match(/^([1-7])(webp)?$/);
  if (m) return `phase_${m[1]}`;
  const x = key.match(/^([1-7])_christmas$/);
  if (x) return `phase_${x[1]}_christmas`;
  return null;
}

function anyFile(dir, names) {
  if (!existsSync(dir)) return false;
  const files = new Set(readdirSync(dir));
  return names.some((n) => files.has(n));
}

/* ---------------------------- placeholder ---------------------------- */

function verifyPlaceholder() {
  for (const t of trees) {
    for (const required of ['product', 'phase_1', 'phase_2', 'phase_3', 'phase_4', 'dead']) {
      if (!anyFile(join(root, `public/assets/trees/${t.gid}`), [`${required}.svg`, `${required}.webp`, `${required}.png`])) {
        note(`missing trees/${t.gid}/${required}.*`);
      }
      if (existsSync(join(root, `public/assets/trees/${t.gid}/${required}.webp`))) {
        note(`placeholder build must not contain original webp: trees/${t.gid}/${required}.webp`);
      }
    }
  }
  for (const s of sounds) {
    if (!anyFile(join(root, 'public/assets/sounds/ambient'), [`${s.gid}.wav`, `${s.gid}.ogg`])) {
      note(`missing sounds/ambient/${s.gid}.*`);
    }
  }
  for (const sfx of ['click', 'slide', 'tree0', 'tree1', 'tree2', 'ring']) {
    if (!anyFile(join(root, 'public/assets/sounds/sfx'), [`${sfx}.wav`, `${sfx}.ogg`])) {
      note(`missing sounds/sfx/${sfx}.*`);
    }
  }
  verifyFonts();
}

/* ------------------------------ original ----------------------------- */

function verifyOriginal() {
  const workspaceTreesPath = join(workspace, 'assets_catalog/trees.json');
  if (!existsSync(workspaceTreesPath)) {
    note('original mode requires the private workspace (../assets_catalog/trees.json)');
    return;
  }
  const wsTrees = JSON.parse(readFileSync(workspaceTreesPath, 'utf8'));
  const treesRoot = join(root, 'public/assets-original/trees');

  let expectedTrees = 0;
  for (const t of wsTrees) {
    if (!t.has_local_files || !t.phases) continue;
    const dir = join(treesRoot, String(t.gid));
    for (const key of Object.keys(t.phases)) {
      const name = phaseTarget(key);
      if (!name) continue;
      expectedTrees++;
      if (!anyFile(dir, [`${name}.webp`, `${name}.png`])) note(`original missing trees/${t.gid}/${name}.*`);
    }
  }

  const animPath = join(workspace, 'assets_catalog/tree_animations.json');
  let expectedFrames = 0;
  if (!existsSync(animPath)) {
    note('original mode requires ../assets_catalog/tree_animations.json');
  } else {
    const groups = JSON.parse(readFileSync(animPath, 'utf8'));
    for (const g of groups) {
      const xmas = g.christmas_variant ? '_christmas' : '';
      const group = `${g.state}_phase_${g.phase}${xmas}`;
      const dir = join(treesRoot, String(g.gid), 'anim');
      for (let i = 0; i < g.frame_count; i++) {
        expectedFrames++;
        if (!existsSync(join(dir, `${group}_${String(i).padStart(2, '0')}.webp`))) {
          note(`original missing frame ${g.gid}/${group}/${i}`);
        }
      }
    }
  }

  for (const s of sounds) {
    if (!existsSync(join(root, `public/assets-original/sounds/ambient/${s.gid}.ogg`))) {
      note(`original missing sounds/ambient/${s.gid}.ogg`);
    }
  }
  for (const sfx of ['click', 'slide', 'tree0', 'tree1', 'tree2', 'ring']) {
    if (!existsSync(join(root, `public/assets-original/sounds/sfx/${sfx}.ogg`))) {
      note(`original missing sounds/sfx/${sfx}.ogg`);
    }
  }

  for (const [semantic, entry] of Object.entries(iconMap)) {
    if (!entry.file) {
      note(`icon-map ${semantic} has no resolved file`);
      continue;
    }
    const dirs = [join(root, 'public/assets-original/icons'), join(root, 'public/assets-original/ui')];
    if (!dirs.some((dir) => existsSync(join(dir, entry.file)))) {
      note(`original missing icon/ui ${entry.file} (${semantic})`);
    }
  }

  if (!existsSync(join(root, 'public/assets-original/ui/landing.html'))) {
    note('original missing ui/landing.html');
  }
  verifyFonts();
  if (!quiet) {
    console.log(`  trees: ${expectedTrees} entries, frames: ${expectedFrames} files`);
  }
}

/* ------------------------------ release ------------------------------ */

function verifyRelease() {
  if (existsSync(join(root, 'public/assets-original'))) {
    note('release build must not contain public/assets-original/');
  }
  if (existsSync(join(root, 'parity'))) {
    note('release build must not contain parity/');
  }
  verifyPlaceholder();
}

function verifyFonts() {
  const fontsDir = join(root, 'public/fonts');
  const required = [
    'source_sans_pro_regular.ttf',
    'source_sans_pro_semibold.ttf',
    'source_sans_pro_bold.ttf',
    'source_sans_pro_black.ttf',
    'roboto_medium_numbers.ttf',
  ];
  for (const file of required) {
    if (!existsSync(join(fontsDir, file))) note(`missing fonts/${file}`);
  }
  if (!existsSync(join(fontsDir, 'fonts.css'))) note('missing fonts/fonts.css');
  if (!existsSync(join(fontsDir, 'OFL.txt'))) note('missing fonts/OFL.txt (Source Sans Pro license)');
}

if (mode === 'original') verifyOriginal();
else if (mode === 'release') verifyRelease();
else verifyPlaceholder();

if (problems.length) {
  console.error(`verify-assets(${mode}): ${problems.length} problem(s)`);
  for (const p of problems.slice(0, 40)) console.error(`  - ${p}`);
  console.error('Run: npm run assets');
  process.exit(1);
}
console.log(`verify-assets(${mode}): OK`);
