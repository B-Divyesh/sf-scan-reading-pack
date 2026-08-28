# Scan Reading Pack — repair 5 handoff

## Release status: READY FOR DEPLOYMENT

This repair addresses every release blocker in independent verification 5 for
candidate `281b2f339ec5b23c1f57998456b185adf6aa3d42`. It preserves the Vite +
TypeScript offline PWA, separate demo database, local OCR, existing exports,
and one-time Sociobot license flow.

## Reproduction and repairs

1. The live backup retry was reproduced before repair: zero projects restored,
   the invalid-file alert remained, and Chromium logged two `connect-src` CSP
   errors for `fetch(data:image/...)`. Backup images are now decoded locally
   from an allowlisted image data URL. All images are validated before writes,
   remote/non-image URLs are rejected, and a successful retry clears the old
   alert.
2. Axe's experimental `label-content-name-mismatch` rule reproduced five
   serious failures at desktop and 390px. Each trace button's accessible name
   now begins with its visible `P1 · Lx` coordinate. The rule passes over the
   populated workbench at both widths.
3. The public confidence-preservation and local deletion promises now have
   entries in `.factory/claims.json`. Exact tests prove a corrected 78% line
   retains its score, a project is removed from IndexedDB, and both saved
   license keys are removed from localStorage.
4. Privacy, terms, demo-library, and 404 headers now link **How it works** to
   `/#how`; the home header keeps its local `#how` target.
5. Playwright now serves `dist/` with headers read from the built
   `staticwebapp.config.json`. The backup regression therefore exercises the
   deployed CSP instead of Vite preview's header-free environment.

## Verification evidence

All commands ran from `/work/repo` on 2026-08-28.

- Clean `npm ci`: 403 packages installed; 0 audit vulnerabilities.
- `npm test`: 12/12 Vitest tests passed in 3 files.
- `npm run lint`: strict TypeScript `--noEmit` passed.
- `npm run build`: passed; `dist/index.html` exists; PWA precache contains 22
  entries (625.03 KiB).
- Every exact command for all 16 entries in `.factory/claims.json` passed
  separately. OCR-heavy shared flows intentionally skip the duplicate mobile
  project and pass in desktop Chromium.
- `npm run test:e2e`: 40 passed, 8 intentional cross-project skips, 0 failed.
  It covers desktop and 390px mobile, import formats, real OCR, correction,
  trace, crop, ZIP/backup, deletion, free/paid limits, privacy traffic,
  production CSP, real 404 responses, offline shell and cached offline OCR.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173`: HTTP 200; 620 ms load;
  title, `lang=en`, one H1, main landmark, image alt text, labelled controls,
  and zero console errors.
- Standalone Axe CLI 4.10.3: 0 violations on `/`, `/demo/`, `/privacy/`, and
  `/terms/`. Playwright Axe also reports no serious/critical findings and no
  experimental label-in-name finding on the workbench at either viewport.
- Lighthouse mobile: Performance 98, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.63 s, LCP 2.30 s, TBT 0 ms, CLS 0.00013, transfer 198,891 B.
- Authored main JS is 51.18 kB raw / 19.61 kB gzip; CSS is 20.43 kB raw /
  5.28 kB gzip; fonts total 60.90 kB; mobile hero AVIF is 37.06 kB.
- Production-policy preview returned the declared CSP, referrer, nosniff,
  frame, permissions, and cache headers. An unknown route returned HTTP 404.

Library/CLI consumer packaging, application-backend health, authentication,
and backend concurrency are not applicable to this static local-first PWA.

## Run and verify

```bash
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

Run one claim with the exact command stored in `.factory/claims.json`. The E2E
server intentionally applies the production Static Web Apps response policy.

## Deployment evidence

Pending commit, push, static upload, and live identity verification.

## Known gaps

None in the repaired product. A second independent release verification is
still required by the factory process.
