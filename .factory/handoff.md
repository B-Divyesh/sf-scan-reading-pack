# Scan Reading Pack — independent verification 4 handoff

## Release status: FAIL

**Do not release candidate
`4402b065e3c6102e8a05d956040130bb3eee5227`.** The deployment at
https://scan-reading-pack.sociobot.in is byte-for-byte this candidate, and its
core flow plus all existing automated gates pass, but fresh acceptance checks
found release-blocking accessibility and claims-contract defects.

The full evidence and exact measurements are in
[`verification-4.md`](verification-4.md).

## Release blockers

1. At 390px, the two demo-banner controls are only 40px high and the five
   source-trace buttons are 25px high. All interactive targets must be at least
   44×44 CSS pixels.
2. Explicit Axe and Lighthouse runs report a serious
   `label-content-name-mismatch` on the desktop and mobile brand: visible “SR”
   is absent from `aria-label="Scan Reading Pack home"`.
3. At 390px and 200% text size, the landing page becomes 454px wide and
   overflows horizontally by 64px, centered on the pricing/license panel.
4. Broader public claims about no uploads/no tracking and later offline OCR are
   not proved by exact claim tests. The current privacy test does not run OCR;
   the offline test only reloads the pre-seeded demo. The “every sample line”
   trace claim tests only line 2.

Low severity: handled unsupported-file input produces the right recoverable
alert but also writes an error stack to the console.

## What passed

- First-read gate and one-click isolated demo.
- All 13 exact `.factory/claims.json` commands after a clean `npm ci`.
- `npm test` (7/7), `npm run lint`, `npm run build`, and `npm run test:e2e`
  (29 passed, 5 intentional skips).
- End-to-end image/PDF import, local OCR, correction, trace, figure crop,
  backup/restore, ZIP export, free-page limit, and recorded paid unlock.
- Personal/demo IndexedDB separation and demo deletion on **Start for real**.
- Live offline reload and offline OCR after model caching; service-worker
  registration/update; Chrome manifest parsing/installability.
- Live identity for HTML, main JS/CSS, and service worker; secure headers,
  immutable asset cache, and real HTTP 404.
- Billing checkout via Sociobot and rate limiting: first 429 at request 31 with
  `Retry-After: 4`.
- Lighthouse mobile: performance 99, accessibility 100, best practices 100,
  SEO 100; LCP 1.6 s, TBT 100 ms, CLS 0. The separate serious experimental
  label-in-name audit still fails acceptance.
- Initial JS/CSS/font/hero transfer budgets.

## Reproduce

```bash
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

Then audit every visible mobile control at 390×844, test the root at 200% text,
run Lighthouse's `label-content-name-mismatch` audit, and extend claims/tests as
specified in `verification-4.md`. Product code was not modified during this
verification.
