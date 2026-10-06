#!/usr/bin/env node
/**
 * extract-assets.mjs
 *
 * Produces runtime assets for the PWA.
 *
 *   VITE_ASSET_MODE=placeholder (default) — generates original SVG tree art and
 *   synthesized WAV audio. 100% self-authored, safe to ship.
 *
 *   VITE_ASSET_MODE=original — copies decoded artwork from the private reverse
 *   workspace (../apktool_out, ../apk_extracted) into public/assets-original/.
 *   LOCAL DEV ONLY, never commit (see .gitignore).
 *
 * Usage: node scripts/extract-assets.mjs [--force] [--quiet]
 *          [--mode=original|placeholder] [--only=trees,frames,icons,ui,fonts,sounds,rive,lottie,landing]
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = join(root, '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const quiet = args.includes('--quiet');
const modeArg = args.find((a) => a.startsWith('--mode='));
const mode = (modeArg?.split('=')[1] ?? process.env.VITE_ASSET_MODE ?? 'placeholder').trim();
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.split('=')[1].split(',').map((s) => s.trim())) : null;

const catalog = JSON.parse(readFileSync(join(root, 'src/assets/catalog/tree-types.json'), 'utf8'));
const workspaceTrees = existsSync(join(workspace, 'assets_catalog/trees.json'))
  ? JSON.parse(readFileSync(join(workspace, 'assets_catalog/trees.json'), 'utf8'))
  : [];
const sounds = JSON.parse(readFileSync(join(root, 'src/assets/catalog/ambient-sounds.json'), 'utf8'));
const iconMap = JSON.parse(readFileSync(join(root, 'src/assets/catalog/icon-map.generated.json'), 'utf8'));
const treeAnimations = existsSync(join(workspace, 'assets_catalog/tree_animations.json'))
  ? JSON.parse(readFileSync(join(workspace, 'assets_catalog/tree_animations.json'), 'utf8'))
  : [];

const PUBLIC = join(root, 'public/assets');
const ORIGINAL = join(root, 'public/assets-original');
let written = 0;
let skipped = 0;
const missing = [];

function write(rel, data, baseDir = PUBLIC) {
  const target = join(baseDir, rel);
  if (existsSync(target) && !force) {
    skipped++;
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, data);
  written++;
  if (!quiet) console.log(`  ${rel}`);
}

function copy(src, rel, baseDir = ORIGINAL) {
  const target = join(baseDir, rel);
  if (existsSync(target) && !force) {
    skipped++;
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(src, target);
  written++;
  if (!quiet) console.log(`  ${rel}`);
}

function want(category) {
  return !only || only.has(category);
}

/* ------------------------------------------------------------------ */
/* Placeholder tree art                                               */
/* ------------------------------------------------------------------ */

function hash(n) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

const TIER_HUES = { 1: 130, 2: 90, 3: 25, 4: 275 };

function palette(gid, tier) {
  const base = TIER_HUES[tier] ?? 120;
  const hue = (base + (hash(gid) % 34) - 17 + 360) % 360;
  return {
    leaf: `hsl(${hue} 45% 52%)`,
    leafDark: `hsl(${hue} 48% 38%)`,
    leafLight: `hsl(${hue} 52% 66%)`,
    flower: `hsl(${(hue + 40) % 360} 70% 62%)`,
  };
}

function treeSvg(gid, tier, phase, opts = {}) {
  const p = palette(gid, tier);
  const dead = opts.dead;
  const product = opts.product;
  const growth = product ? 0.45 : 0.3 + (phase / 6) * 0.85;
  const seed = hash(gid * 31 + phase);

  const canopyBlobs = [];
  const blobs = product ? 3 : 5 + (seed % 3);
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + (seed % 10) / 10;
    const rad = (18 + (hash(seed + i) % 12)) * growth;
    const cx = 128 + Math.cos(a) * 34 * growth;
    const cy = 96 + Math.sin(a) * 22 * growth - growth * 14;
    canopyBlobs.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}" fill="${p.leaf}"/>`,
    );
  }
  const flowers = [];
  if (!dead && !product) {
    const count = Math.min(9, Math.max(0, phase - 1) * 2);
    for (let i = 0; i < count; i++) {
      const cx = 94 + (hash(seed + i * 7) % 68);
      const cy = 58 + (hash(seed + i * 13) % 62);
      flowers.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${p.flower}" opacity="0.9"/>`);
    }
  }

  const stem = dead
    ? `<path d="M128 206 C128 160 118 140 104 118 M128 168 C140 150 150 140 158 122" stroke="#8a8a8a" stroke-width="6" fill="none" stroke-linecap="round"/>`
    : product
      ? `<path d="M128 206 C128 188 124 180 118 172" stroke="${p.leafDark}" stroke-width="7" fill="none" stroke-linecap="round"/>
         <ellipse cx="140" cy="176" rx="14" ry="8" fill="${p.leaf}" transform="rotate(-22 140 176)"/>`
      : `<path d="M128 206 C128 ${196 - growth * 22} 126 ${178 - growth * 30} 128 ${168 - growth * 46}" stroke="#7a5230" stroke-width="${(6 + growth * 3).toFixed(1)}" fill="none" stroke-linecap="round"/>`;

  const canopy = dead
    ? ''
    : canopyBlobs.join('') +
      `<circle cx="128" cy="${(96 - growth * 14).toFixed(1)}" r="${(20 * growth).toFixed(1)}" fill="${p.leafDark}" opacity="0.55"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img">
<ellipse cx="128" cy="228" rx="66" ry="12" fill="rgba(0,0,0,0.18)"/>
<path d="M74 200 L182 200 L170 232 L86 232 Z" fill="#874E07"/>
<path d="M74 200 L182 200 L176 212 L80 212 Z" fill="#6F4000"/>
<rect x="70" y="194" width="116" height="12" rx="5" fill="#9F611B"/>
${stem}
${canopy}
${flowers.join('')}
</svg>
`;
}

async function extractPlaceholder() {
  // A leftover original-mode copy would be served/bundled by mistake, so drop
  // it unless the caller explicitly wants to keep it for offline use.
  if (existsSync(ORIGINAL) && !args.includes('--keep-original')) {
    rmSync(ORIGINAL, { recursive: true, force: true });
  }

  for (const t of catalog) {
    for (let phase = 1; phase <= 7; phase++) {
      write(`trees/${t.gid}/phase_${phase}.svg`, treeSvg(t.gid, t.tier, phase));
    }
    write(`trees/${t.gid}/dead.svg`, treeSvg(t.gid, t.tier, 0, { dead: true }));
    write(`trees/${t.gid}/product.svg`, treeSvg(t.gid, t.tier, 1, { product: true }));
  }
  write('trees/placeholder.svg', treeSvg(-1, 2, 3));

  for (const s of sounds) write(`sounds/ambient/${s.gid}.wav`, ambientWav(s.gid));
  write('sounds/sfx/click.wav', sfxWav('click'));
  write('sounds/sfx/slide.wav', sfxWav('slide'));
  write('sounds/sfx/tree0.wav', sfxWav('tree0'));
  write('sounds/sfx/tree1.wav', sfxWav('tree1'));
  write('sounds/sfx/tree2.wav', sfxWav('tree2'));
  write('sounds/sfx/ring.wav', sfxWav('ring'));

  const manifest = {
    mode: 'placeholder',
    generatedAt: new Date().toISOString(),
    trees: catalog.length,
    sounds: sounds.length,
  };
  write('manifest.json', JSON.stringify(manifest, null, 2) + '\n');

  // Fonts are OFL-licensed and bundled in public/fonts/ for both modes (P-112).
  extractFonts();
}

/* ------------------------------------------------------------------ */
/* Synthesized WAV audio (8-bit mono)                                 */
/* ------------------------------------------------------------------ */

const RATE = 8000;

function wavFromSamples(samples) {
  const data = Buffer.alloc(samples.length);
  for (let i = 0; i < samples.length; i++) {
    data[i] = Math.max(0, Math.min(255, Math.round(128 + samples[i] * 127)));
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ambientWav(gid) {
  const seconds = 2;
  const rng = mulberry32(gid * 7919 + 17);
  const n = seconds * RATE;
  const out = new Float32Array(n);
  const kind = gid % 5;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    // soft noise bed shaped by a slow LFO so loops feel alive
    const lfo = 0.5 + 0.5 * Math.sin((2 * Math.PI * (kind + 1) * t) / seconds);
    let v = (rng() - 0.5) * 0.05 * (0.6 + 0.4 * lfo);
    if (kind === 2) v += Math.sin(2 * Math.PI * 220 * t) * 0.012;
    if (kind === 3) v += Math.sin(2 * Math.PI * 330 * t) * 0.01;
    out[i] = v;
  }
  return wavFromSamples(out);
}

function sfxWav(name) {
  switch (name) {
    case 'click': {
      const n = 0.08 * RATE;
      const out = new Float32Array(n);
      const rng = mulberry32(3);
      for (let i = 0; i < n; i++) out[i] = (rng() - 0.5) * 0.5 * Math.exp(-i / (n * 0.18));
      return wavFromSamples(out);
    }
    case 'slide': {
      const n = 0.14 * RATE;
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = i / RATE;
        const f = 380 + (t / 0.14) * 700;
        out[i] = Math.sin(2 * Math.PI * f * t) * 0.22 * (1 - i / n);
      }
      return wavFromSamples(out);
    }
    case 'ring': {
      const seconds = 3;
      const n = seconds * RATE;
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = i / RATE;
        const strike = t % 0.75;
        const decay = Math.exp(-strike * 5);
        out[i] =
          (Math.sin(2 * Math.PI * 880 * strike) * 0.5 +
            Math.sin(2 * Math.PI * 1320 * strike) * 0.25) *
          decay *
          0.5;
      }
      return wavFromSamples(out);
    }
    default: {
      const freq = name === 'tree0' ? 523 : name === 'tree1' ? 659 : 784;
      const seconds = 0.7;
      const n = seconds * RATE;
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = i / RATE;
        const env = Math.exp(-t * 3.2);
        out[i] = (Math.sin(2 * Math.PI * freq * t) * 0.4 + Math.sin(2 * Math.PI * freq * 2 * t) * 0.12) * env;
      }
      return wavFromSamples(out);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Original mode helpers                                              */
/* ------------------------------------------------------------------ */

const RES_DIR = join(workspace, 'apktool_out/res');
const RAW_DIR = join(RES_DIR, 'raw');
const DENSITY_PRIORITY = ['xxhdpi', 'xhdpi', 'hdpi', 'mdpi', 'ldpi', 'nodpi', ''];

let resIndex = null;
function scanResDirs() {
  if (resIndex) return resIndex;
  resIndex = new Map();
  if (!existsSync(RES_DIR)) return resIndex;
  for (const dir of readdirSync(RES_DIR)) {
    if (!dir.startsWith('drawable')) continue;
    const density = dir === 'drawable' ? '' : dir.replace(/^drawable-/, '').replace(/-.*$/, '');
    if (!DENSITY_PRIORITY.includes(density)) continue;
    for (const file of readdirSync(join(RES_DIR, dir))) {
      const dot = file.lastIndexOf('.');
      if (dot <= 0) continue;
      const base = file.slice(0, dot).replace(/\.9$/, '');
      const ext = file.slice(dot + 1);
      if (!resIndex.has(base)) resIndex.set(base, []);
      resIndex.get(base).push({ density, file, ext, path: join(RES_DIR, dir, file) });
    }
  }
  return resIndex;
}

const IMAGE_EXTS = new Set(['webp', 'png', 'jpg', 'jpeg']);

function pickResFile(resource) {
  const files = scanResDirs().get(resource);
  if (!files || files.length === 0) return null;
  const rank = (f) => {
    const densityRank = DENSITY_PRIORITY.indexOf(f.density);
    const extRank = IMAGE_EXTS.has(f.ext) ? 0 : f.ext === 'xml' ? 1 : 2;
    return [extRank, densityRank < 0 ? DENSITY_PRIORITY.length : densityRank];
  };
  return [...files].sort((a, b) => rank(a)[0] - rank(b)[0] || rank(a)[1] - rank(b)[1])[0];
}

/* --- Android VectorDrawable -> SVG (icons are simple; groups supported) --- */

const colorsCache = new Map();
function colorRef(name) {
  if (colorsCache.has(name)) return colorsCache.get(name);
  let value = null;
  for (const file of ['colors.xml', 'colors-v31.xml', 'color-night/colors.xml']) {
    const path = join(RES_DIR, 'values', file);
    if (!existsSync(path)) continue;
    const re = new RegExp(`<color name="${name}"[^>]*>([^<]+)</color>`);
    const m = readFileSync(path, 'utf8').match(re);
    if (m) {
      value = m[1].trim();
      break;
    }
  }
  colorsCache.set(name, value);
  return value;
}

function androidColor(value) {
  if (!value) return null;
  let v = value.trim();
  if (v.startsWith('@color/')) v = colorRef(v.slice(7)) ?? '#000000';
  if (v.startsWith('#')) {
    if (v.length === 9) {
      const a = parseInt(v.slice(1, 3), 16) / 255;
      return `rgba(${parseInt(v.slice(3, 5), 16)},${parseInt(v.slice(5, 7), 16)},${parseInt(v.slice(7, 9), 16)},${a.toFixed(3)})`;
    }
    return v;
  }
  return v; // named colors are rare in these drawables
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`android:${name}="([^"]*)"`));
  return m ? m[1] : null;
}

function shapeToSvg(xmlPath) {
  const src = readFileSync(xmlPath, 'utf8');
  const shape = src.match(/<shape\b[^>]*>/)?.[0] ?? '';
  const kind = attr(shape, 'shape') ?? 'rectangle';
  const solid = androidColor(src.match(/<solid[^>]*android:color="([^"]+)"/)?.[1] ?? null);
  const stroke = src.match(/<stroke[^>]*>/)?.[0] ?? '';
  const strokeColor = androidColor(attr(stroke, 'color'));
  const strokeWidth = parseFloat(attr(stroke, 'width') ?? '0') || 0;
  const radius = parseFloat(src.match(/<corners[^>]*android:radius="([^"]+)"/)?.[1] ?? '0') || 0;
  const size = 100;
  const inset = strokeWidth / 2;
  if (kind === 'oval') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" preserveAspectRatio="none"><ellipse cx="${size / 2}" cy="${size / 2}" rx="${size / 2 - inset}" ry="${size / 2 - inset}" fill="${solid ?? 'none'}"${strokeColor ? ` stroke="${strokeColor}" stroke-width="${strokeWidth}"` : ''}/></svg>\n`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" preserveAspectRatio="none"><rect x="${inset}" y="${inset}" width="${size - strokeWidth}" height="${size - strokeWidth}" rx="${radius}" ry="${radius}" fill="${solid ?? 'none'}"${strokeColor ? ` stroke="${strokeColor}" stroke-width="${strokeWidth}"` : ''}/></svg>\n`;
}

function vectorToSvg(xmlPath) {
  const src = readFileSync(xmlPath, 'utf8');
  const vectorTag = src.match(/<vector\b[^>]*>/)?.[0] ?? '';
  const width = attr(vectorTag, 'width')?.replace('dp', '') ?? '24';
  const height = attr(vectorTag, 'height')?.replace('dp', '') ?? '24';
  const vw = attr(vectorTag, 'viewportWidth') ?? width;
  const vh = attr(vectorTag, 'viewportHeight') ?? height;

  const parts = [];
  const groupStack = [];
  const tokenRe = /<(\/?)(group|path)\b([^>]*?)(\/?)>/g;
  let m;
  while ((m = tokenRe.exec(src)) !== null) {
    const [, closing, tag, attrs, selfClose] = m;
    if (tag === 'group') {
      if (closing) {
        const g = groupStack.pop();
        parts.push(`</g>`);
        void g;
      } else {
        const tx = attr(attrs, 'translateX') ?? '0';
        const ty = attr(attrs, 'translateY') ?? '0';
        const sx = attr(attrs, 'scaleX') ?? '1';
        const sy = attr(attrs, 'scaleY') ?? '1';
        const rot = attr(attrs, 'rotation') ?? '0';
        const px = attr(attrs, 'pivotX') ?? '0';
        const py = attr(attrs, 'pivotY') ?? '0';
        const transforms = [`translate(${tx} ${ty})`];
        if (rot !== '0') transforms.push(`rotate(${rot} ${px} ${py})`);
        if (sx !== '1' || sy !== '1') transforms.push(`scale(${sx} ${sy})`);
        parts.push(`<g transform="${transforms.join(' ')}">`);
        groupStack.push(tag);
      }
      continue;
    }
    if (closing || !attrs) continue;
    const pathData = attr(attrs, 'pathData');
    if (!pathData) continue;
    const fill = androidColor(attr(attrs, 'fillColor'));
    const stroke = androidColor(attr(attrs, 'strokeColor'));
    const fillAlpha = attr(attrs, 'fillAlpha');
    const strokeAlpha = attr(attrs, 'strokeAlpha');
    const strokeWidth = attr(attrs, 'strokeWidth');
    const strokeCap = attr(attrs, 'strokeLineCap');
    const strokeJoin = attr(attrs, 'strokeLineJoin');
    const fillType = attr(attrs, 'fillType');
    const svgAttrs = [`d="${pathData}"`];
    svgAttrs.push(fill ? `fill="${fill}"` : 'fill="none"');
    if (stroke) svgAttrs.push(`stroke="${stroke}"`);
    if (strokeWidth) svgAttrs.push(`stroke-width="${strokeWidth}"`);
    if (strokeCap) svgAttrs.push(`stroke-linecap="${strokeCap.toLowerCase()}"`);
    if (strokeJoin) svgAttrs.push(`stroke-linejoin="${strokeJoin.toLowerCase()}"`);
    if (fillAlpha) svgAttrs.push(`fill-opacity="${fillAlpha}"`);
    if (strokeAlpha) svgAttrs.push(`stroke-opacity="${strokeAlpha}"`);
    if (fillType === 'evenOdd') svgAttrs.push('fill-rule="evenodd"');
    parts.push(`<path ${svgAttrs.join(' ')}/>`);
    void selfClose;
  }
  if (parts.length === 0) return null;
  while (groupStack.length) {
    parts.push('</g>');
    groupStack.pop();
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${vw} ${vh}">${parts.join('')}</svg>\n`;
}

/* --- categories --------------------------------------------------- */

const PHASE_TARGETS = {
  dead: 'dead',
  product: 'product',
  launch: 'launch',
};

function phaseTarget(key) {
  if (PHASE_TARGETS[key]) return PHASE_TARGETS[key];
  const m = key.match(/^([1-7])(webp)?$/);
  if (m) return `phase_${m[1]}`;
  const x = key.match(/^([1-7])_christmas$/);
  if (x) return `phase_${x[1]}_christmas`;
  return null;
}

function extractTrees() {
  for (const t of workspaceTrees) {
    if (!t.has_local_files || !t.phases) continue;
    const targets = new Map();
    for (const [key, byDensity] of Object.entries(t.phases)) {
      const name = phaseTarget(key);
      if (!name) continue;
      for (const [density, rel] of Object.entries(byDensity)) {
        const densityRank = DENSITY_PRIORITY.indexOf(density.replace('drawable-', ''));
        if (densityRank < 0) continue;
        const ext = rel.endsWith('.png') ? 'png' : 'webp';
        const candidate = { rel, ext, densityRank, isWebp: ext === 'webp' ? 0 : 1 };
        const current = targets.get(name);
        if (
          !current ||
          candidate.isWebp < current.isWebp ||
          (candidate.isWebp === current.isWebp && candidate.densityRank < current.densityRank)
        ) {
          targets.set(name, candidate);
        }
      }
    }
    for (const [name, candidate] of targets) {
      const src = join(workspace, 'apktool_out', candidate.rel);
      if (!existsSync(src)) {
        missing.push(`tree ${t.gid}/${name}`);
        continue;
      }
      copy(src, `trees/${t.gid}/${name}.${candidate.ext}`);
    }
  }
}

function extractFrames() {
  if (treeAnimations.length === 0) {
    missing.push('assets_catalog/tree_animations.json');
    return;
  }
  const frameDir = join(RES_DIR, 'drawable');
  for (const group of treeAnimations) {
    const xmas = group.christmas_variant ? '_christmas' : '';
    const groupName = `${group.state}_phase_${group.phase}${xmas}`;
    for (let idx = 0; idx < group.frame_count; idx++) {
      const file = `frame_${group.state}_tree_type_${group.gid}_phase_${group.phase}${xmas}_${String(idx).padStart(2, '0')}.webp`;
      const src = join(frameDir, file);
      if (!existsSync(src)) {
        missing.push(`frame ${group.gid}/${groupName}/${idx}`);
        continue;
      }
      copy(src, `trees/${group.gid}/anim/${groupName}_${String(idx).padStart(2, '0')}.webp`);
    }
  }
}

const UI_SEMANTICS = new Set([
  'plantBall',
  'plantBallXmas',
  'groundPieceXmas',
  'walkthrough1',
  'walkthrough2',
  'walkthrough3',
  'walkthroughBg1',
  'walkthroughBgAll',
  'walkthroughPrivacy',
  'tutorialForest',
  'tutorialSocial',
  'tutorialSoil',
  'tutorialStudying',
  'tutorialWorking',
  'tutorialTree0',
  'tutorialTree1',
  'tutorialTree2',
  'newLabel',
  'pageBackground',
  'hazeNoise',
  'fakeBackground',
  'emptyForest',
]);

function extractIconsAndUi() {
  for (const [semantic, entry] of Object.entries(iconMap)) {
    const picked = pickResFile(entry.resource);
    if (!picked) {
      missing.push(`icon ${semantic} (${entry.resource})`);
      continue;
    }
    const sub = UI_SEMANTICS.has(semantic) ? 'ui' : 'icons';
    if (IMAGE_EXTS.has(picked.ext)) {
      const out = `${entry.resource}.${picked.ext}`;
      copy(picked.path, `${sub}/${out}`);
    } else {
      const svg = convertDrawableToSvg(picked.path);
      if (!svg) {
        missing.push(`icon ${semantic} (${entry.resource}: vector conversion failed)`);
        continue;
      }
      write(`${sub}/${entry.resource}.svg`, svg, ORIGINAL);
    }
  }

  // Sound cover art (22 covers) for the sound store/picker.
  const coverDir = join(RES_DIR, 'drawable-xxhdpi');
  const covers = scanDirSafe(coverDir).filter((f) => /^(ambient_sound_|sound_)[a-z0-9_]+\.webp$/.test(f));
  for (const file of covers) {
    copy(join(coverDir, file), `ui/sounds/${file}`);
  }

  // Landing webview bundle (verbatim, self-contained).
  const landing = join(RAW_DIR, 'landing_html.html');
  if (existsSync(landing)) copy(landing, 'ui/landing.html');
  else missing.push('landing_html.html');
}

function scanDirSafe(dir) {
  return existsSync(dir) ? readdirSync(dir) : [];
}

function convertDrawableToSvg(xmlPath) {
  const src = readFileSync(xmlPath, 'utf8');
  if (src.includes('<vector')) return vectorToSvg(xmlPath);
  if (src.includes('<shape')) return shapeToSvg(xmlPath);
  return null;
}

const AMBIENT_FILES = {
  0: 'rain_forest',
  1: 'paris_cafe',
  2: 'thunder_rain',
  3: 'newyork_time_square',
  4: 'night_forest',
  5: 'sandy_beach',
  6: 'lofi_i_6',
  7: 'lofi_i_7',
  8: 'lofi_i_8',
  9: 'lofi_ii_9',
  10: 'lofi_ii_10',
  11: 'lofi_ii_11',
  12: 'lofi_iii_12',
  13: 'lofi_iii_13',
  14: 'lofi_iii_14',
  15: 'fireplace_15',
  16: 'waterfall_white_16',
  17: 'waterfall_brown_17',
  18: 'japanese_garden_18',
  19: 'waterfall_pink_19',
  20: 'examination_time_20',
  21: 'ambient_sound_21',
  22: 'ambient_sound_22',
  23: 'ambient_sound_23',
  24: 'ambient_sound_24',
  25: 'ambient_sound_25',
  26: 'ambient_sound_26',
  27: 'ambient_sound_27',
  28: 'ambient_sound_28',
  29: 'ambient_sound_29',
  30: 'ambient_sound_30',
  31: 'ambient_sound_31',
  32: 'ambient_sound_32',
};

const SFX_FILES = {
  click: 'sound_click1.ogg',
  slide: 'sound_slide.ogg',
  tree0: 'sound_tree0.ogg',
  tree1: 'sound_tree1.ogg',
  tree2: 'sound_tree2.ogg',
  ring: 'sound_ring_c.ogg',
};

function extractSounds() {
  for (const s of sounds) {
    const name = AMBIENT_FILES[s.gid];
    if (!name) {
      missing.push(`ambient ${s.gid}`);
      continue;
    }
    const src = join(RAW_DIR, `${name}.ogg`);
    if (!existsSync(src)) {
      missing.push(`ambient ${name}.ogg`);
      continue;
    }
    copy(src, `sounds/ambient/${s.gid}.ogg`);
  }
  for (const [key, file] of Object.entries(SFX_FILES)) {
    const src = join(RAW_DIR, file);
    if (!existsSync(src)) {
      missing.push(`sfx ${file}`);
      continue;
    }
    copy(src, `sounds/sfx/${key}.ogg`);
  }
}

const RIVE_MAP = {
  'cta.riv': 'cta.riv',
  'relax_breathe_riv.riv': 'relax_breathe.riv',
  'relax_onboarding_riv.riv': 'relax_onboarding.riv',
  'relax_theme_1_riv.riv': 'relax_theme_1.riv',
  'relax_theme_2_riv.riv': 'relax_theme_2.riv',
  'relax_theme_3_riv.riv': 'relax_theme_3.riv',
  'relax_theme_4_riv.riv': 'relax_theme_4.riv',
  'relax_theme_5_riv.riv': 'relax_theme_5.riv',
  'task_system.riv': 'task_system.riv',
  'time_guard_intro_riv.riv': 'time_guard_intro.riv',
};

function extractRive() {
  for (const [src, out] of Object.entries(RIVE_MAP)) {
    const path = join(RAW_DIR, src);
    if (!existsSync(path)) {
      missing.push(`rive ${src}`);
      continue;
    }
    copy(path, `ui/${out}`);
  }
}

const LOTTIE_MAP = [
  [join(workspace, 'apk_extracted/assets/rainbow_bridge.json'), 'rainbow_bridge.json'],
  [join(workspace, 'apk_extracted/assets/pending_anim.json'), 'pending_anim.json'],
  [join(RAW_DIR, 'event_ribbon.json'), 'event_ribbon.json'],
  [join(RAW_DIR, 'progress_bar_loading.json'), 'progress_bar_loading.json'],
  [join(RAW_DIR, 'settings_gift_box_icon.json'), 'gift_box_icon.json'],
  [join(RAW_DIR, 'lottie_special_offer_button.json'), 'special_offer_button.json'],
];

function extractLottie() {
  for (const [src, out] of LOTTIE_MAP) {
    if (!existsSync(src)) {
      missing.push(`lottie ${out}`);
      continue;
    }
    copy(src, `ui/${out}`);
  }
}

function extractFonts() {
  try {
    execFileSync(process.execPath, [join(root, 'scripts/extract-fonts.mjs'), '--quiet', ...(force ? ['--force'] : [])], {
      stdio: 'inherit',
    });
  } catch {
    missing.push('fonts (extract-fonts.mjs failed)');
  }
}

function normalizeTreeExtensions() {
  // ImageMagick is optional; when present, normalise PNG trees to WebP so the
  // runtime can resolve a single extension. The app also has a .png fallback.
  let magick = null;
  try {
    execFileSync('magick', ['-version'], { stdio: 'ignore' });
    magick = 'magick';
  } catch {
    try {
      execFileSync('convert', ['-version'], { stdio: 'ignore' });
      magick = 'convert';
    } catch {
      magick = null;
    }
  }
  if (!magick) {
    if (!quiet) console.log('  (magick not found — keeping PNG trees as .png)');
    return;
  }
  const treeRoot = join(ORIGINAL, 'trees');
  if (!existsSync(treeRoot)) return;
  for (const gid of readdirSync(treeRoot)) {
    const dir = join(treeRoot, gid, '');
    if (!statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.png')) continue;
      const src = join(dir, file);
      const out = join(dir, file.replace(/\.png$/, '.webp'));
      if (existsSync(out)) continue;
      try {
        execFileSync(magick, [src, '-quality', '90', out], { stdio: 'ignore' });
        rmSync(src, { force: true });
        written++;
        if (!quiet) console.log(`  trees/${gid}/${file.replace(/\.png$/, '.webp')}`);
      } catch {
        missing.push(`convert ${gid}/${file}`);
      }
    }
  }
}

async function extractOriginal() {
  if (!existsSync(RES_DIR) || !existsSync(join(RES_DIR, 'values/public.xml'))) {
    console.error('original mode: decoded resources not found (../apktool_out).');
    console.error('Run placeholder mode instead, or keep the private workspace present.');
    process.exitCode = 1;
    return;
  }
  if (want('trees')) extractTrees();
  if (want('frames')) extractFrames();
  if (want('icons') || want('ui')) extractIconsAndUi();
  if (want('sounds')) extractSounds();
  if (want('rive')) extractRive();
  if (want('lottie')) extractLottie();
  if (want('fonts')) extractFonts();
  normalizeTreeExtensions();

  write(
    'manifest.json',
    JSON.stringify(
      {
        mode: 'original',
        generatedAt: new Date().toISOString(),
        categories: [...(only ?? ['all'])],
        missing: missing.length,
      },
      null,
      2,
    ) + '\n',
    ORIGINAL,
  );

  mkdirSync(join(root, 'parity'), { recursive: true });
  writeFileSync(
    join(root, 'parity/asset-missing.md'),
    `# Missing original assets\n\nGenerated ${new Date().toISOString()}\n\n${
      missing.length ? missing.map((m) => `- ${m}`).join('\n') : '_None._'
    }\n`,
  );
  if (missing.length) {
    console.warn(`original mode: ${missing.length} missing asset(s) — see parity/asset-missing.md`);
  } else if (!quiet) {
    console.log('original mode: all mapped assets present');
  }
  console.warn('original mode: artwork copied locally. DO NOT COMMIT public/assets-original/**');
}

if (mode === 'original') {
  await extractOriginal();
} else {
  await extractPlaceholder();
}
console.log(`assets(${mode}): ${written} written, ${skipped} skipped`);
