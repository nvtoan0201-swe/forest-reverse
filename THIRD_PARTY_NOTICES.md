# Third-party notices

Focus Grove bundles or depends on the following third-party software. Each project keeps its own
license; the list below is informational.

## Runtime dependencies

| Package | License |
|---|---|
| react, react-dom | MIT |
| react-router | MIT |
| zustand | MIT |
| dexie, dexie-react-hooks | Apache-2.0 |
| framer-motion | MIT |
| howler | MIT |
| html-to-image | MIT |
| i18next, react-i18next | MIT |

## Development dependencies

Vite, TypeScript, Tailwind CSS, Vitest, Testing Library, Playwright, ESLint, Prettier and their
transitive dependencies are used under their respective licenses (predominantly MIT, ISC and
Apache-2.0). See `package-lock.json` and each package's LICENSE file for details.

## Fonts

The design system uses **Source Sans Pro** (4 weights: regular, semibold, bold, black) and
**Roboto Medium Numbers** for clock numerals. Both are bundled in `public/fonts/`:

- Source Sans Pro — Copyright 2010-2020 Adobe, licensed under the SIL Open Font License 1.1
  (full text in `public/fonts/OFL.txt`).
- Roboto — Copyright Google, licensed under the Apache License 2.0.

## Artwork and audio

All tree artwork, icons, UI art and audio files shipped in the default (placeholder) runtime are
generated locally by `scripts/extract-assets.mjs` as original SVG and synthesized WAV content. No
third-party or copyrighted game assets are included. Generated assets live in `public/assets/**`,
which is gitignored by default.

The optional `ASSET_MODE=original` development mode copies decoded artwork from a private local
workspace into `public/assets-original/**`. That directory is gitignored, is never part of a public
build (guarded by `verify-assets --mode=release` and `vite.config.ts`), and must not be
redistributed.
