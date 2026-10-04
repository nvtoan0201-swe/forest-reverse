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
 *   workspace (../apktool_out, ../apk_extracted). LOCAL DEV ONLY, never commit.
 *
 * Usage: node scripts/extract-assets.mjs [--force] [--quiet] [--mode=original|placeholder]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const quiet = args.includes('--quiet');
const modeArg = args.find((a) => a.startsWith('--mode='));
const mode = (modeArg?.split('=')[1] ?? process.env.VITE_ASSET_MODE ?? 'placeholder').trim();

const catalog = JSON.parse(readFileSync(join(root, 'src/assets/catalog/tree-types.json'), 'utf8'));
const sounds = JSON.parse(readFileSync(join(root, 'src/assets/catalog/ambient-sounds.json'), 'utf8'));

const PUBLIC = join(root, 'public/assets');
let written = 0;
let skipped = 0;

function write(rel, data) {
  const target = join(PUBLIC, rel);
  if (existsSync(target) && !force) {
    skipped++;
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, data);
  written++;
  if (!quiet) console.log(`  ${rel}`);
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
/* Original mode (local only)                                         */
/* ------------------------------------------------------------------ */

async function extractOriginal() {
  const workspace = join(root, '..');
  const drawables = [
    join(workspace, 'apktool_out/res/drawable-xxhdpi'),
    join(workspace, 'apktool_out/res/drawable-xhdpi'),
    join(workspace, 'apktool_out/res/drawable-hdpi'),
  ].filter(existsSync);
  if (drawables.length === 0) {
    console.error('original mode: decoded resources not found (../apktool_out).');
    console.error('Run placeholder mode instead, or keep the private workspace present.');
    process.exitCode = 1;
    return;
  }
  const { copyFileSync } = await import('node:fs');
  const pick = (file) => {
    for (const dir of drawables) {
      const candidate = join(dir, file);
      if (existsSync(candidate)) return candidate;
    }
    return null;
  };
  for (const t of catalog) {
    for (let phase = 1; phase <= 7; phase++) {
      const src = pick(`tree_type_${t.gid}_phase_${phase}.webp`) ?? pick(`tree_type_${t.gid}_phase_${phase}.png`);
      if (!src) continue;
      const ext = src.endsWith('.png') ? 'png' : 'webp';
      const target = join(PUBLIC, `trees/${t.gid}/phase_${phase}.${ext}`);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(src, target);
      written++;
    }
  }
  console.warn('original mode: artwork copied locally. DO NOT COMMIT public/assets/**');
}

if (mode === 'original') {
  await extractOriginal();
} else {
  await extractPlaceholder();
}
console.log(`assets(${mode}): ${written} written, ${skipped} skipped`);
