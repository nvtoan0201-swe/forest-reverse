#!/usr/bin/env node
/**
 * map-resources.mjs — resolves obfuscated R.drawable fields back to real
 * resource names and on-disk files.
 *
 * Sources (private reverse workspace, never committed):
 *   ../jadx_mem/sources/cc/forestapp/R.java   field -> hex id
 *   ../apktool_out/res/values/public.xml      hex id -> resource name
 *   ../apktool_out/res/drawable-<density>/    resource -> file + density
 *
 * Outputs:
 *   parity/resource-map.json                  full field/id/name/density table
 *   src/assets/catalog/icon-map.generated.json  semantic -> { field, id, resource, file }
 *
 * Usage: node scripts/map-resources.mjs [--quiet]
 * Exit code 1 if the workspace is missing or a semantic entry cannot resolve.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = join(root, '..');
const quiet = process.argv.includes('--quiet');

const R_JAVA = join(workspace, 'jadx_mem/sources/cc/forestapp/R.java');
const PUBLIC_XML = join(workspace, 'apktool_out/res/values/public.xml');
const RES_DIR = join(workspace, 'apktool_out/res');

const DENSITY_PRIORITY = ['xxhdpi', 'xhdpi', 'hdpi', 'mdpi', 'ldpi', 'nodpi', ''];

/**
 * Semantic name -> candidate resource names (first match wins). Mirrors the
 * verified mapping table in plans/05_UI_ANIMATION_PARITY/01_ASSETS.md §4.
 */
const SEMANTICS = {
  menu: ['menu_btn'],
  modeTimer: ['countdown_mode_main_page'],
  modeFocusOff: ['ic_focus_mode_off'],
  modeFocusOn: ['ic_focus_mode_on', 'ic_focus_mode'],
  coinLarge: ['ic_s_coin_large'],
  addCoin: ['add_coin'],
  gem: ['gem_icon_border'],
  addGem: ['ic_add_gem'],
  headphone: ['headphone_btn'],
  headphoneMute: ['headphone_mute_btn'],
  back: ['back_btn2'],
  note: ['forest_rounded_btn'],
  share: ['share_btn'],
  giveUpBg: ['rounded_corner_twb'],
  snow: ['snowball'],
  splash: ['sapling'],
  premium: ['ic_s_premium_simple'],
  storeUnlock: ['store_unlock_btn'],
  storeNew: ['store_new'],
  coin: ['coin'],
  tagExpand: ['ic_tag_expand'],
  drawerForest: ['forest_btn'],
  drawerTimeline: ['timeline_btn'],
  drawerShield: ['proicons_shield'],
  drawerRelax: ['ic_relax'],
  drawerTag: ['tag_btn'],
  drawerFriend: ['friend_btn'],
  drawerAchievement: ['achievement_btn'],
  drawerStore: ['store_btn'],
  drawerRealTree: ['real_tree_btn'],
  drawerNews: ['news_btn'],
  drawerSettings: ['setting_btn'],
  drawerChallenge: ['ic_menu_task'],
  drawerStarter: ['ic_menu_starter_challenges'],
  plantBall: ['plant_ball'],
  plantBallXmas: ['plant_ball_christmas'],
  groundPieceXmas: ['ground_piece_xmas'],
  walkthrough1: ['walkthrough_1'],
  walkthrough2: ['walkthrough_2'],
  walkthrough3: ['walkthrough_3'],
  walkthroughBg1: ['walkthrough_bg_1'],
  walkthroughBgAll: ['walkthrough_bg_all'],
  walkthroughPrivacy: ['dialog_walkthrough_privacy'],
  tutorialForest: ['tutorial_forest'],
  tutorialSocial: ['tutorial_social'],
  tutorialSoil: ['tutorial_soil'],
  tutorialStudying: ['tutorial_studying'],
  tutorialWorking: ['tutorial_working'],
  tutorialTree0: ['tutorial_tree_0'],
  tutorialTree1: ['tutorial_tree_1'],
  tutorialTree2: ['tutorial_tree_2'],
  newLabel: ['new_label_background'],
  pageBackground: ['page_background'],
  hazeNoise: ['haze_noise'],
  fakeBackground: ['fake_background'],
  emptyForest: ['empty_forest_placeholder'],
  failureReasonBtn: ['failure_reason_btn'],
  webLogo: ['web_logo'],
};

function fail(msg) {
  console.error(`map-resources: ${msg}`);
  process.exit(1);
}

if (!existsSync(R_JAVA)) fail(`missing ${R_JAVA}`);
if (!existsSync(PUBLIC_XML)) fail(`missing ${PUBLIC_XML}`);

/* ------------------------------------------------------------------ */
/* Parse R.java drawable class                                         */
/* ------------------------------------------------------------------ */

const rSource = readFileSync(R_JAVA, 'utf8');
const drawableBlock = rSource.match(/public static final class drawable \{([\s\S]*?)\n    \}/);
if (!drawableBlock) fail('could not find R.drawable class');

const fieldById = new Map();
const fieldRe = /public static\s+(?:final\s+)?int\s+(\w+)\s*=\s*(0x[0-9a-fA-F]+);/g;
for (const m of drawableBlock[1].matchAll(fieldRe)) {
  fieldById.set(m[2].toLowerCase(), m[1]);
}

/* ------------------------------------------------------------------ */
/* Parse public.xml drawables                                          */
/* ------------------------------------------------------------------ */

const publicSource = readFileSync(PUBLIC_XML, 'utf8');
const nameById = new Map();
const publicRe = /<public type="drawable" name="([^"]+)" id="(0x[0-9a-fA-F]+)"\s*\/>/g;
for (const m of publicSource.matchAll(publicRe)) {
  nameById.set(m[2].toLowerCase(), m[1]);
}

/* ------------------------------------------------------------------ */
/* Resolve files with density priority                                 */
/* ------------------------------------------------------------------ */

let resFiles = null;
function scanResFiles() {
  if (resFiles) return resFiles;
  resFiles = new Map();
  if (!existsSync(RES_DIR)) return resFiles;
  for (const dir of readdirSync(RES_DIR)) {
    if (!dir.startsWith('drawable')) continue;
    const density = dir === 'drawable' ? '' : dir.replace(/^drawable-/, '').replace(/-.*$/, '');
    if (!DENSITY_PRIORITY.includes(density)) continue;
    for (const file of readdirSync(join(RES_DIR, dir))) {
      const dot = file.lastIndexOf('.');
      if (dot <= 0) continue;
      const base = file.slice(0, dot).replace(/\.9$/, '');
      const ext = file.slice(dot + 1);
      if (!resFiles.has(base)) resFiles.set(base, []);
      resFiles.get(base).push({ density, frame: dir, file, ext });
    }
  }
  return resFiles;
}

const IMAGE_EXTS = new Set(['webp', 'png', 'jpg', 'jpeg']);
function resolveFile(resource) {
  const files = scanResFiles().get(resource);
  if (!files || files.length === 0) return null;
  const rank = (f) => {
    const densityRank = DENSITY_PRIORITY.indexOf(f.density);
    const extRank = IMAGE_EXTS.has(f.ext) ? 0 : f.ext === 'svg' ? 1 : f.ext === 'xml' ? 2 : 3;
    return [extRank, densityRank < 0 ? DENSITY_PRIORITY.length : densityRank];
  };
  files.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    return ra[0] - rb[0] || ra[1] - rb[1];
  });
  const picked = files[0];
  const outExt = IMAGE_EXTS.has(picked.ext) ? picked.ext : 'svg';
  return {
    source: picked.file,
    density: picked.density || 'base',
    target: `${resource}.${outExt}`,
    needsVectorConversion: picked.ext === 'xml',
  };
}

/* ------------------------------------------------------------------ */
/* Build maps                                                          */
/* ------------------------------------------------------------------ */

const resources = {};
for (const [id, name] of nameById) {
  resources[name] = { id, field: fieldById.get(id) ?? null };
}

const iconMap = {};
const unresolved = [];
for (const [semantic, candidates] of Object.entries(SEMANTICS)) {
  let picked = null;
  for (const candidate of candidates) {
    if (resources[candidate]) {
      picked = candidate;
      break;
    }
  }
  if (!picked) {
    unresolved.push(`${semantic} (tried: ${candidates.join(', ')})`);
    continue;
  }
  const info = resources[picked];
  const file = resolveFile(picked);
  iconMap[semantic] = {
    field: info.field,
    id: info.id,
    resource: picked,
    file: file?.target ?? null,
    density: file?.density ?? null,
  };
}

mkdirSync(join(root, 'parity'), { recursive: true });
writeFileSync(
  join(root, 'parity/resource-map.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      drawables: resources,
      semantics: iconMap,
    },
    null,
    2,
  ) + '\n',
);
writeFileSync(
  join(root, 'src/assets/catalog/icon-map.generated.json'),
  JSON.stringify(iconMap, null, 2) + '\n',
);

const missingFiles = Object.entries(iconMap).filter(([, v]) => !v.file);
if (!quiet) {
  console.log(`map-resources: ${Object.keys(iconMap).length} semantics resolved`);
  if (missingFiles.length) {
    console.log(`  no on-disk file for: ${missingFiles.map(([k]) => k).join(', ')}`);
  }
}
if (unresolved.length) {
  console.error(`map-resources: ${unresolved.length} unresolved semantic(s):`);
  for (const u of unresolved) console.error(`  - ${u}`);
  process.exit(1);
}
if (missingFiles.length) {
  console.error(`map-resources: ${missingFiles.length} semantic(s) have no resource file`);
  process.exit(1);
}
