# Scan Reading Pack — build handoff

## Independent verification status — **FAIL** (2026-08-28)

Candidate `1477079d1a425f237379feb1a23d3f1e47f25c7d` was independently tested
against https://scan-reading-pack.sociobot.in from a fresh install. It **fails
release acceptance** despite a working local conversion flow and matching live
assets. The required `.factory/claims.json` is missing, so the mandatory
demo-entry claim tests do not exist. The live first screen has no “Try it with
sample data” action; `/demo` and `/?demo=1` are ordinary empty landing pages,
with no sample data, demo banner/reset controls, isolation, or `.factory/demo.md`.

See [`.factory/verification.md`](verification.md) for exact commands, test
results, live hash evidence, and defects by severity. Do not promote this
candidate until its Critical findings are repaired and independently retested.

## Delivered

- Finished Vite + TypeScript offline PWA for PDF, PNG, JPEG, and WebP scans.
- Browser-local English OCR using self-hosted Tesseract.js/WASM and language data. The recognition runtime is lazy-loaded and cached after first use; source files are never uploaded.
- PDF pages are rasterized locally with PDF.js. Imported pages, OCR lines, original confidence, edits, exact bounding boxes, and figure crops persist in IndexedDB.
- Two-pane review workbench with page navigation, low-confidence queue, editable lines, mark-checked state, and coordinate-correct source highlighting even when the scan is letterboxed.
- Pointer/touch figure cropping with crops retained in the project.
- Self-contained ZIP reading pack: Markdown and selectable HTML with page anchors/source links, plain text, source page images, extracted figures, and `source-map.json`. Paid unlock additionally includes page-marked SSML.
- JSON project backup/restore, specific delete confirmation, empty/loading/error/offline states, and responsive 390px layout.
- PWA manifest and icons, versioned Workbox app-shell cache, runtime OCR cache, navigation fallback, and update prompt.
- Sociobot one-time license contract: production checkout link, return-token capture, localStorage persistence, at-most-daily verification, cached/offline unlock, restore field, and removal control. The free tier recognizes five pages per project while keeping corrections, backups, source pages, and core exports available.
- Privacy and terms routes, copyright/accuracy warnings, no analytics, no remote fonts/scripts, original generated hero artwork with provenance in `.factory/design.md`.

## Run and deploy

```bash
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

Exact factory build command: `npm ci && npm run build`. Static output is `./dist`; `dist/index.html` exists at its root.

For billing test mode: `VITE_BILLING_BASE=https://pilot-api.sociobot.in npm run build`. Production defaults to `https://api.sociobot.in`.

## Verification — 2026-08-28

- `npm test`: 4/4 unit tests passed (page anchors, SSML escaping/markers, source coordinates/confidence, safe filenames).
- `npm run build`: passed with Vite 8.2.2; PWA generated with 20 precached entries.
- `npm run test:e2e`: 8/8 Playwright checks passed across desktop Chromium and a 390px-class mobile profile. These cover keyboard skip navigation, Axe, image import, IndexedDB refresh persistence, figure cropping, real Tesseract OCR, export readiness, and a true offline reload.
- Axe: 0 serious or critical findings on landing and project workbench in both browser profiles.
- Console smoke test: no console errors on initial load.
- `npm audit` and `npm audit --omit=dev`: 0 known vulnerabilities.
- Production mobile Lighthouse: Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**.
- Lighthouse timings: FCP **1.3 s**, LCP **2.0 s**, TBT **0 ms**, CLS **0.001**.
- Initial authored JS is 45.07 KB plus the 5.71 KB PWA registration helper (about 20.2 KB combined gzip); CSS is 18.45 KB (4.95 KB gzip). PDF.js and OCR are loaded only when needed.
- Hero assets: AVIF 40 KB, WebP 64 KB, JPEG fallback 136 KB; self-hosted fonts total 68 KB.
- Manual visual review completed for 1280px desktop and mobile full-page captures. Generated hero has no people, brands, text artifacts, or misleading UI.

## Known constraints / next steps

- OCR v1 is English-only and is not intended for handwriting, equations, or complex tables. Additional self-hosted language packs can follow based on real demand.
- First OCR use downloads about 16 MB across the selected WASM core and 11 MB English model; both are cached. App-shell installation remains lightweight.
- Very large PDFs are memory-sensitive in browsers; input is capped at 80 MB per source and 200 pages. Pages are rasterized sequentially to reduce pressure.
- The factory still needs to register the `scan-reading-pack` product/return URL in Sociobot billing and confirm the listed $19 USD one-time price before paid checkout is promoted in production.
- The stated pilot success measure (fewer than 10 corrections per 100 pages across 20 documents) requires a real user/document pilot; the product now records the confidence/review data needed for that validation without analytics.
