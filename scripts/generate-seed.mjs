#!/usr/bin/env node
/**
 * generate-seed.mjs
 * Writes the self-authored catalog JSON consumed by the app (src/assets/catalog).
 * The catalog intentionally uses generic plant/animal/nature names and
 * self-designed prices so the public build does not ship any original
 * copyrighted strings or economy values.
 *
 * If run inside the reverse-engineering workspace (../data_exports present)
 * it still uses this curated dataset — the app never depends on private data.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'assets', 'catalog');
mkdirSync(outDir, { recursive: true });

const SPECIES = [
  { gid: 0, title: 'Cedar', tier: 1, free: true },
  { gid: 1, title: 'Flower Tree', tier: 1 },
  { gid: 2, title: 'Willow', tier: 1 },
  { gid: 3, title: 'Birch', tier: 2 },
  { gid: 4, title: 'Lemon Tree', tier: 2 },
  { gid: 5, title: 'Triplet Sprouts', tier: 2 },
  { gid: 6, title: 'Bush', tier: 1, free: true },
  { gid: 7, title: 'Fern', tier: 1 },
  { gid: 8, title: 'Cherry Blossom', tier: 3 },
  { gid: 9, title: 'Coconut Palm', tier: 2 },
  { gid: 11, title: 'Meadow Grass', tier: 1 },
  { gid: 12, title: 'Pine Tree', tier: 2 },
  { gid: 13, title: 'Cactus Ball', tier: 1 },
  { gid: 14, title: 'Pumpkin Patch', tier: 1 },
  { gid: 16, title: 'Fir Tree', tier: 2 },
  { gid: 17, title: 'Golden Bamboo', tier: 2 },
  { gid: 18, title: 'Mushroom', tier: 1 },
  { gid: 19, title: 'Saguaro Cactus', tier: 3 },
  { gid: 20, title: 'Ginkgo', tier: 3 },
  { gid: 21, title: 'Wisteria', tier: 2 },
  { gid: 22, title: 'Watermelon Vine', tier: 2 },
  { gid: 23, title: 'Bamboo', tier: 3 },
  { gid: 25, title: 'Sunflower', tier: 3 },
  { gid: 26, title: 'Rose', tier: 3 },
  { gid: 27, title: 'Maple Tree', tier: 3 },
  { gid: 28, title: 'Baobab', tier: 3 },
  { gid: 30, title: 'Banana Tree', tier: 3 },
  { gid: 33, title: 'Carnation', tier: 2 },
  { gid: 34, title: 'Apple Tree', tier: 3 },
  { gid: 40, title: 'Blue Oak', tier: 3 },
  { gid: 41, title: 'Green Oak', tier: 3 },
  { gid: 42, title: 'Pink Oak', tier: 3 },
  { gid: 43, title: 'Amber Oak', tier: 3 },
  { gid: 44, title: 'Purple Oak', tier: 3 },
  { gid: 46, title: 'Forget-me-not', tier: 2 },
  { gid: 47, title: 'Coral Bloom', tier: 1, free: true },
  { gid: 57, title: 'Puppy Tree', tier: 3 },
  { gid: 62, title: 'Celestial Tree', tier: 4 },
  { gid: 63, title: 'Weeping Willow', tier: 4 },
  { gid: 64, title: 'Clover', tier: 3 },
  { gid: 65, title: 'Eco Tree', tier: 4 },
  { gid: 67, title: 'Aqua Tree', tier: 3 },
  { gid: 72, title: 'Lily', tier: 3 },
  { gid: 74, title: 'Tulip', tier: 3 },
  { gid: 75, title: 'Plum Blossom', tier: 4 },
  { gid: 76, title: 'Camellia', tier: 3 },
  { gid: 79, title: 'Lavender', tier: 2 },
  { gid: 81, title: 'Dandelion', tier: 1, free: true },
  { gid: 82, title: 'Golden Wings', tier: 4 },
  { gid: 83, title: 'Osmanthus', tier: 3 },
  { gid: 84, title: 'Cosmos', tier: 3 },
  { gid: 87, title: 'Narcissus', tier: 3 },
  { gid: 96, title: 'Lotus', tier: 2 },
  { gid: 98, title: 'Golden Trumpet', tier: 3 },
  { gid: 100, title: 'Jacaranda', tier: 3 },
  { gid: 101, title: 'Geranium', tier: 3 },
  { gid: 106, title: 'Monstera', tier: 1, free: true },
  { gid: 113, title: 'Calla Lily', tier: 3 },
  { gid: 117, title: 'White Rose', tier: 3 },
  { gid: 119, title: 'Money Tree', tier: 3 },
  { gid: 121, title: 'Corn Poppy', tier: 3 },
  { gid: 128, title: 'Snapdragon', tier: 3 },
  { gid: 129, title: 'Hyacinth', tier: 3 },
  { gid: 130, title: 'Dahlia', tier: 3 },
  { gid: 180, title: 'Golden Pothos', tier: 4 },
];

const SOUNDS = [
  { gid: 0, title: 'Forest Rain' },
  { gid: 1, title: 'Cafe in Paris' },
  { gid: 2, title: 'Rain and Thunder' },
  { gid: 3, title: 'City Square' },
  { gid: 4, title: 'Night Forest' },
  { gid: 5, title: 'Sandy Beach' },
  { gid: 6, title: 'Lofi I' },
  { gid: 7, title: 'Lofi II' },
  { gid: 8, title: 'Lofi III' },
  { gid: 9, title: 'Lofi IV' },
  { gid: 10, title: 'Lofi V' },
  { gid: 11, title: 'Lofi VI' },
  { gid: 12, title: 'Lofi VII' },
  { gid: 13, title: 'Lofi VIII' },
  { gid: 14, title: 'Lofi IX' },
  { gid: 15, title: 'Cozy Fireplace' },
  { gid: 16, title: 'Waterfall (white)' },
  { gid: 17, title: 'Waterfall (brown)' },
  { gid: 18, title: 'Japanese Garden' },
  { gid: 19, title: 'Waterfall (pink)' },
  { gid: 20, title: 'Study Room' },
  { gid: 21, title: 'Binaural Beats 8Hz' },
  { gid: 22, title: 'Binaural Beats 16Hz' },
  { gid: 23, title: 'Piano Heartstring' },
  { gid: 24, title: 'Piano Book' },
  { gid: 25, title: 'Piano Train' },
  { gid: 26, title: 'Piano Rain' },
  { gid: 27, title: 'Energy Drive' },
  { gid: 28, title: 'Waking Groove' },
  { gid: 29, title: 'Overdrive Flow' },
  { gid: 30, title: 'After Snow' },
  { gid: 31, title: 'Summer Shake' },
  { gid: 32, title: 'Autumn Whisper' },
];

const TAG_COLORS = [
  [1, '#F09684', 1],
  [2, '#E5745E', 2],
  [3, '#F2A855', 4],
  [4, '#FFC759', 5],
  [5, '#FADF58', 6],
  [6, '#D5D95D', 7],
  [7, '#A7BF60', 8],
  [8, '#82D2D9', 10],
  [9, '#66BBCC', 11],
  [10, '#9A8DD9', 13],
  [11, '#D68751', 3],
  [12, '#6ED7A2', 9],
  [13, '#7490B8', 12],
  [14, '#D9A3B1', 14],
  [15, '#B38691', 15],
];

const TIER_COIN_PRICE = { 1: 150, 2: 300, 3: 600, 4: 1200 };

const products = [];
let productId = 1;
for (const s of SPECIES) {
  products.push({
    id: productId++,
    title: s.title,
    productableType: 'TreeType',
    productableGid: s.gid,
    purchaseType: s.free ? 3 : 1,
    price: s.free ? 0 : (TIER_COIN_PRICE[s.tier] ?? 300),
    consumable: false,
    purchaseable: true,
    isFree: Boolean(s.free),
    isPinned: s.gid === 12,
  });
}
for (const s of SOUNDS) {
  products.push({
    id: productId++,
    title: s.title,
    productableType: 'AmbientSound',
    productableGid: s.gid,
    purchaseType: s.gid === 0 ? 3 : 1,
    price: s.gid === 0 ? 0 : 300,
    consumable: false,
    purchaseable: true,
    isFree: s.gid === 0,
    isPinned: s.gid === 0,
  });
}

const coinRewards = [60, 100, 300, 500, 600, 1200, 2000].map((amount, i) => ({
  gid: i + 1,
  title: `${amount} coin reward`,
  amount,
}));
const gemRewards = [5, 10, 30, 60, 90, 200, 600].map((amount, i) => ({
  gid: i + 1,
  title: `${amount} gems`,
  amount,
}));
const gemPacks = [
  { gid: 1, skuId: 'gems_60', amount: 60, isHot: 0 },
  { gid: 2, skuId: 'gems_200', amount: 200, isHot: 1 },
  { gid: 3, skuId: 'gems_600', amount: 600, isHot: 0 },
];

const phrases = [
  { phraseId: 1, phraseType: 'growing', content: 'Breathe in, breathe out. Your tree is growing.' },
  { phraseId: 2, phraseType: 'growing', content: 'Stay a while. Focus is a habit.' },
  { phraseId: 3, phraseType: 'success', content: 'A little patience grows a mighty tree.' },
  { phraseId: 4, phraseType: 'failure', content: 'Every forest starts again tomorrow.' },
];

const files = {
  'tree-types.json': SPECIES.map(({ gid, title, tier }) => ({ gid, title, tier })),
  'products.json': products,
  'ambient-sounds.json': SOUNDS.map((s) => ({ ...s, file: `ambient/${s.gid}.wav` })),
  'tag-colors.json': TAG_COLORS.map(([tcid, hexCode, sortOrder]) => ({ tcid, hexCode, sortOrder })),
  'coin-rewards.json': coinRewards,
  'gem-rewards.json': gemRewards,
  'gem-packs.json': gemPacks,
  'phrases.json': phrases,
};

for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(outDir, name), JSON.stringify(data, null, 2) + '\n');
  console.log(`  wrote src/assets/catalog/${name}`);
}
console.log(`seed: ${SPECIES.length} species, ${SOUNDS.length} sounds, ${products.length} products`);
