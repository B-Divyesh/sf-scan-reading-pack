# Scan Reading Pack — repair 6 handoff

## Release status: DEPLOYED

This repair addresses every blocker in independent verification 6 for
candidate `99b85bcc7f0fca2a58fa9f282fcaa87609e802ae`. It preserves the Vite +
TypeScript offline PWA, isolated demo workspace, local OCR, trace/correction
workflow, export formats, and Sociobot one-time license flow.

## Reproduction and repairs

1. At 1280 × 720, the candidate put the H1 at y=212–607, the audience at
   y=631–701, the sample action at y=733–789, and the facts at y=877–947.
   A low-height desktop layout now uses a 56px maximum H1, tighter vertical
   rhythm, and balanced columns. The repaired H1 is y=164–334, audience
   y=348–418, action and note y=432–488, and all three facts y=562–632.
2. At 1440 × 900, line 4's trace button was covered by `.project-foot`.
   `.source-panel` and `.text-panel` now have `min-height: 0` and clipped
   overflow, so `.blocks` owns the scroll and no content escapes the fixed
   workbench row. A regression checks all five lines against the scroller,
   `elementFromPoint()`, real pointer clicks, keyboard focus, and the 3px
   visible focus ring.
3. `.factory/claims.json` now registers the 24-hour active-license check and
   refund/revocation behavior. Exact tests cover both sides of 86,400,000ms,
   ensure only one verification request, apply a recorded revoked verdict,
   confirm the user-facing revoked notice, remove SSML, and restore the free
   five-page boundary.
4. Build identity advances to 1.0.3 and the installed-app start URL to `?v=3`.

## Local verification evidence

All commands ran from `/work/repo` on 2026-08-28.

- Clean `npm ci`: 403 packages installed; 0 audit vulnerabilities.
- `npm test`: 13/13 Vitest tests passed in 3 files.
- `npm run lint`: TypeScript `--noEmit` passed.
- `npm run build`: passed; `dist/index.html` exists; the PWA precache contains
  22 entries (625.55 KiB).
- Every exact command for all 18 entries in `.factory/claims.json` passed
  separately. Shared OCR/entitlement matrices intentionally skip only their
  duplicate mobile project.
- `npm run test:e2e`: 46 passed, 12 intentional cross-project skips, 0 failed
  across Desktop Chrome and 390 × 844 mobile. Coverage includes real local
  OCR, import formats, corrections, trace/crop, ZIP and backup, delete,
  free/paid boundaries, privacy traffic, CSP/404 policy, offline shell,
  cached offline OCR, keyboard focus, 200% text, and 44px touch targets.
- Playwright Axe found zero serious/critical issues on `/`, `/demo/`,
  `/privacy/`, `/terms/`, and the real 404 route at both configured viewports.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173` passed: HTTP 200,
  629ms load, correct title and language, one H1/main, complete alt/control
  names, and no console errors. Evidence is in
  `.factory/qa-artifacts/repair-6/local-verify/`.
- Local Lighthouse mobile: Performance 98, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.7s, LCP 2.3s, TBT 0ms, CLS 0, total transfer 195 KiB.
  Evidence is `.factory/qa-artifacts/repair-6/lighthouse-local.json`.
- Initial authored JS is 51.33 kB raw plus 5.71 kB Workbox (22.13 kB gzip
  combined); CSS is 20.81 kB raw / 5.38 kB gzip; fonts total 60.90 kB; the
  mobile hero AVIF is 37.06 kB.
- The production-policy preview returned CSP, strict referrer, nosniff, frame
  denial, and permissions headers. HTML revalidates and an unknown route
  returns HTTP 404. The service-worker prompt/update wiring has a contract
  regression; offline control and reload pass in Chromium.

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

Run any claim using the exact command stored in `.factory/claims.json`. The
browser suite serves `dist/` with the production response policy.

## Deployment evidence

- Product repair commit `ba261605b5840789e6c37a8b9db13a52e03955f1` was
  pushed to `origin/main`.
- Azure Static Web Apps deployment `d5a59818-f86d-4490-a86f-cae4dfa6d934`
  succeeded against the existing `sf-scan-reading-pack` app in Central US.
  The default host is `agreeable-plant-0f34b3d10.7.azurestaticapps.net`; the
  production URL is `https://scan-reading-pack.sociobot.in`.
- Local and live SHA-256 hashes match exactly: `index.html`
  `ce17c207c8e9a447aa1c9277f69e70638b1361c37295ab2f9fb90e0086e7bdbe`,
  `sw.js` `48cc45db44873704c9af67db395244e2cf67fa391aa286ed7371fa431eb48682`,
  manifest `4d973d3087c913d1b81a93c91a7a7ed6577cc3ab1e7604765905858fcef0097d`,
  main JS `427a9cc76dcffc61fd0b6268821ec03e26ab3d95f0c45d855d679cdd84aff143`,
  and main CSS
  `e0db26c32d5a9d1a9447333817d62dcd07b7bf0f499c0a7f8b47a942f2981080`.
- Live `verify-url.sh` passed: HTTP 200, 1,231ms load, correct title and
  language, one H1/main, complete alt/control names, and zero console errors.
- Live 1280 × 720 first-read geometry exactly matches the repaired local
  bounds and ends at y=632. At 1440 × 900, all five trace controls owned their
  pointer hit, accepted a real click, held keyboard focus, and showed a solid
  3px outline.
- Live Axe found zero serious/critical issues across `/`, `/demo/`,
  `/privacy/`, `/terms/`, and the 404 route. At 390 × 844, all first-read
  content fits, the smallest of 26 visible demo controls is 44 × 44px, and
  Axe again found zero serious/critical issues.
- The live service worker controls the page, reloads the shell offline, and
  completes `registration.update()`. The production root returns HTTP 200,
  unknown routes return 404, and CSP, HSTS, nosniff, frame, referrer, and
  permissions policies are present.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.2s, LCP 1.5s, TBT 0ms, CLS 0, transfer 140 KiB.
- Post-deploy evidence is in `.factory/qa-artifacts/repair-6/live-verify/`,
  `live-audit.json`, and `lighthouse-live.json`.

## Known gaps

None in the repaired product. A new independent release verification is still
required by the factory process.
