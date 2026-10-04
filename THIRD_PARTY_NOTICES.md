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

The design system references **Source Sans Pro / Source Sans 3**, which is licensed under the
SIL Open Font License 1.1. This repository does not bundle font binaries; the UI falls back to
system fonts when the family is not installed. If you add the font, keep the OFL license text
with it.

## Artwork and audio

All tree artwork, icons, UI art and audio files shipped at runtime are generated locally by
`scripts/extract-assets.mjs` as original SVG and synthesized WAV content. No third-party or
copyrighted game assets are included. Generated assets live in `public/assets/**`, which is
gitignored by default.
