# Scan Reading Pack — repair handoff

## Release repair

This repair addresses every finding in independent verification 2 for candidate `a37e1f757a192a0ebd2aa9a4f1199ca16687e0ee`.

- Added the missing free-tier claim contract. `five-page-free-limit` seeds a six-page browser project from `/demo/`, reaches page six, and observes the stated free-limit error.
- Replaced the copy-only unlock check with an entitlement regression. A recorded valid Sociobot license verdict proves that page six begins local OCR and that the exported ZIP includes `audiobook.ssml`; the same check verifies the $19 checkout destination. No live billing request or charge is made.
- Made the compact home brand and footer Privacy/Terms links actual 44 by 44px touch targets. The exact 390px Playwright project measures all three boxes.
- Cleared a previous invalid-import alert as soon as a later valid import is accepted. The recovery regression creates an 80MiB-plus file, confirms the size error, then imports the shipped scan and asserts there is no alert.

The existing local OCR, source trace, figure crop, persistence, demo isolation, offline reload, private-network, export, metadata, security-header, and 404 behaviour remain intact.

## Verify locally

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

Executed from a clean install on 2026-08-28:

- `npm ci`: 403 packages installed; audit reported 0 vulnerabilities.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm test`: 7/7 Vitest tests passed.
- `npm run build`: passed; `dist/index.html` and PWA output were generated; precache contains 22 entries. Authored main JS is 50.88 kB (19.66 kB gzip) and CSS is 19.76 kB (5.17 kB gzip).
- `npm run test:e2e`: 26 Playwright executions passed across desktop Chromium and the exact 390×844 project (two viewport-specific checks skip on the other project). It includes keyboard skip-link use, Axe serious/critical scans, OCR, import recovery, offline demo reload, privacy network checks, all claims, and the 44px measurements.
- Every exact command in `.factory/claims.json` was also run individually and passed: `demo-sandbox`, `offline-reload`, `source-trace`, `pack-export`, `browser-private`, `scan-import`, `local-ocr`, `five-page-free-limit`, and `one-time-unlock`.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/` passed: title, `lang=en`, one h1, main landmark, image alt text, and no page-console errors. The direct `@axe-core/cli` invocation could not launch Selenium Chrome in this image; the product's Playwright `@axe-core/playwright` scans passed instead on both desktop and mobile.
- Static response policy and immutable-cache configuration continue to be asserted in `tests/release-contract.test.ts`; PWA offline/update behavior is covered by the browser suite.

## Deploy

The static deployment root is `dist/`.

```bash
/opt/fleet/lib/deploy-static.sh scan-reading-pack dist
```

After deployment, verify the live URL and its asset hashes against this build:

```bash
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh \
  https://scan-reading-pack.sociobot.in /tmp/scan-reading-pack-verify-live
```

## Known constraints

- OCR is English-only and is not appropriate for handwriting, equations, or complex tables. Important output must be checked against its source page.
- The purchase registration and production checkout availability are owned by the factory Sociobot billing setup; the app only uses the required Sociobot API contract.
