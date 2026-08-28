# Scan Reading Pack — repair handoff

## Release repair

This repair addresses every finding in the independent verification for
candidate `1477079d1a425f237379feb1a23d3f1e47f25c7d`.

- Added a one-click **Try it with sample data** action and direct `/demo/` and
  `/?demo=1` entries. The sample opens directly in the trace workbench.
- Added the persistent Demo — sample data banner, Reset demo, and Start for
  real controls. Demo work is isolated in IndexedDB
  `demo:scan-reading-pack`; real projects remain in `scan-reading-pack`.
  Leaving demo deletes its database. Demo mode does not read the real library
  or license localStorage state.
- Added the required `.factory/claims.json`, `.factory/demo.md`, and exact
  `@claim:` Playwright coverage for demo isolation, offline reload, source
  trace, ZIP contents, same-origin privacy, scan import/persistence, local
  OCR, and the stated one-time unlock destination.
- Rewrote the first screen in plain language for readers with scanned books or
  reports; added `.factory/copy-audit.md`.
- Added canonical, Open Graph, Twitter, and Apple-touch metadata; a product
  1200×630 social image derived from the existing original hero art; `/demo/`
  sitemap entry; titles for all routes; and a designed 404 page.
- Added `staticwebapp.config.json` at the repository and deploy roots. It sets
  CSP, referrer, MIME, frame, and permissions policies; immutable caching for
  hashed/static assets; and an HTTP-404 rewrite to the designed page.
- Made `npm run test:e2e` build first, so it works from a clean install.
  Browser coverage now includes desktop Chromium and an exact 390px mobile
  viewport.

## Verify locally

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

All commands above passed on 2026-08-28:

- `npm ci`: 403 packages installed; `npm audit --omit=dev`: 0 vulnerabilities.
- `npm run lint`: TypeScript check passed.
- `npm test`: 7/7 tests passed, including static-host response/metadata
  contract regressions.
- `npm run build`: passed; `dist/index.html`, `dist/demo/index.html`,
  `dist/404.html`, and `dist/staticwebapp.config.json` exist. The PWA precache
  contains 22 entries.
- `npm run test:e2e`: 20/20 passed across Chromium desktop and 390px mobile.
  It includes Axe serious/critical checks, keyboard skip-link coverage, import
  and refresh persistence, figure crop, real OCR, all claim checks, and true
  offline reload.
- `verify-url.sh http://127.0.0.1:4173/`: passed with title, `lang="en"`, one
  H1, main landmark, complete image alt text, and no browser console errors.
- Lighthouse mobile against the production preview: Performance 99,
  Accessibility 100, Best Practices 100, SEO 100; LCP 1.9 s and CLS 0.
- Initial authored application JS is 50.87 KB (19.66 KB gzip); authored CSS is
  19.64 KB (5.16 KB gzip). OCR and PDF code remain lazy-loaded.

Each public claim is independently runnable from a fresh demo context using
the command in `.factory/claims.json`, for example:

```bash
npm run test:e2e -- --grep @claim:offline-reload
```

## Deploy

Repair implementation commit `7f138ff` was pushed to `origin/main` and
deployed to `https://scan-reading-pack.sociobot.in` on 2026-08-28 (Azure Static
Web Apps deployment `f1b61384-2296-4d91-8185-faf9ff59c1fc`). The live
`index.html` SHA-256 matched `dist/index.html` exactly:
`e4fff52a242403f25ed85159bcb158b7c8f9d09e61ae2e27c6d7af9f2c7a6d92`.

Live post-deploy evidence:

- `verify-url.sh` passed with no browser console errors, title, `lang`, one
  H1, main landmark, and complete image alt text.
- `/demo/`, `/privacy/`, and `/terms/` returned HTTP 200; an unknown route
  returned HTTP 404 and rendered the designed “This page is not on the
  workbench.” page, both before and after service-worker control.
- The live demo showed its sample workbench and persistent demo banner at
  390px.
- The live app JS response has `Cache-Control: public, max-age=31536000,
  immutable`; root and asset responses have the configured CSP, nosniff, and
  referrer policy.

The static deployment root is `dist/`. Repeat deployment with:

```bash
/opt/fleet/lib/deploy-static.sh scan-reading-pack dist
```

Post-deploy verification should use:

```bash
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh \
  https://scan-reading-pack.sociobot.in /tmp/scan-reading-pack-verify
```

## Known constraints

- OCR is English-only and is not suitable for handwriting, equations, or
  complex tables. Verify important output against its source page.
- The one-time product registration and checkout availability remain owned by
  the factory’s Sociobot billing setup; the shipped integration uses the
  required Sociobot API contract.
