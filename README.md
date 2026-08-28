# Scan Reading Pack

Scan Reading Pack is an offline-first PWA for readers who need usable text from image-only books and reports without losing the connection to the scan. It runs English OCR in the browser, queues uncertain lines for review, lets the reader jump from text to the matching page region, extracts figure crops, and exports a self-contained reading pack.

It is for personal archives, researchers, students, and accessibility workflows where page references and private local processing matter more than opaque “perfect transcription” claims.

## What ships

- Local OCR for PDF, PNG, JPEG, and WebP scans, with an 11 MB English model cached after first use
- Persistent projects in IndexedDB: source pages, coordinates, corrections, confidence, and figure crops
- A review queue for lines under 82% confidence and a line-to-source trace view
- ZIP export containing Markdown, selectable standalone HTML, plain text, extracted figures, and `source-map.json`
- One-time paid unlock for unlimited pages and SSML audiobook export; the free edition recognizes five pages per project and keeps all correction, backup, and core export tools available
- Installable service worker, offline app shell, explicit JSON project backup/restore, and responsive keyboard-accessible UI
- Local privacy and terms pages at `/privacy/` and `/terms/`

OCR is not a guarantee. Verify quotations, tables, formulas, unusual type, and damaged pages against the original scan. Only process material you have the right to use.

## Develop

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`. No API keys are required. OCR runtime files and the English language model are self-hosted under `public/`.

## Test and build

```bash
npm test
npm run build
npm run test:e2e
```

The end-to-end suite uses Playwright 1.58.2 and starts the production preview automatically. It verifies desktop and mobile rendering, Axe accessibility, import/persistence, real local OCR, figure cropping, and offline reload.

The exact deploy build command is:

```bash
npm ci && npm run build
```

Static output lands in `./dist`, with `dist/index.html` at its root. Deploy that directory as a history-fallback static site. The factory controls DNS and deployment.

## Billing configuration

Production verification uses `https://api.sociobot.in`. A staging build can use the pilot service without code changes:

```bash
VITE_BILLING_BASE=https://pilot-api.sociobot.in npm run build
```

The integration uses the product slug, not a hardcoded provider/product ID. The factory must register the matching Sociobot product and return URL before paid checkout is live.

## Privacy and architecture

Source files never leave the browser. Projects are stored in IndexedDB; license state is stored in localStorage and verified at most once per day. There are no analytics, tracking pixels, remote fonts, or runtime CDN scripts. Network access is limited to the Sociobot license endpoint when a user buys or restores a license.

The app uses Vite + TypeScript, PDF.js, Tesseract.js/WASM, fflate, IndexedDB, and a Workbox-generated service worker. See [`.factory/design.md`](.factory/design.md) for the visual system and asset provenance, and [`.factory/handoff.md`](.factory/handoff.md) for current verification results.

## License

MIT. See [`LICENSE`](LICENSE).
