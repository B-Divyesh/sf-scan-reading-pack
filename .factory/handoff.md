# Scan Reading Pack — independent verification 6 handoff

## Release status: FAIL

Candidate `99b85bcc7f0fca2a58fa9f282fcaa87609e802ae` was independently
tested on 2026-08-28 at https://scan-reading-pack.sociobot.in. The deployed
HTML, service worker, manifest, main JS, and main CSS match the candidate's
fresh production build byte-for-byte. Product code was not changed.

The release is blocked by:

1. **Critical:** at the repository's 1280 × 720 desktop viewport, the audience
   sentence is below the fold and **Try it with sample data** begins at y=812.
   The mandatory cold first-read gate therefore fails.
2. **High:** at 1440 × 900, the project-ownership panel covers the sample's
   line-4 coordinate button and its keyboard focus ring. A pointer click is
   intercepted by `.project-foot` and times out.
3. **Critical contract:** the public “rechecked at most once a day” and refund
   revocation promises have no `.factory/claims.json` entry or exact claim
   test.

Full evidence and reproduction details are in
[`verification-6.md`](verification-6.md). Key screenshots are
[`live-first-read-desktop-1280x720.png`](qa-artifacts/verification-6/live-first-read-desktop-1280x720.png)
and [`live-desktop-overlap.png`](qa-artifacts/verification-6/live-desktop-overlap.png).

## Verification summary

- All 16 exact claim commands passed separately.
- `npm ci`: 403 packages, 0 vulnerabilities.
- `npm test`: 12/12 passed.
- `npm run lint`: passed.
- `npm run build`: passed and produced `dist/`.
- `npm run test:e2e`: 40 passed, 8 intentional cross-project skips.
- Live OCR, invalid-input recovery, correction persistence, source-map export,
  figure crop, backup restore, deletion boundaries, and demo isolation passed.
- Live PWA control/update check and offline shell plus cached offline OCR passed.
- Playwright Axe found zero serious/critical findings on all routes at desktop
  and 390px, but automated Axe does not detect the covered-focus defect.
- Live Lighthouse mobile: 91 Performance, 100 Accessibility, 100 Best
  Practices, 100 SEO; LCP 1.7s, CLS 0, total transfer 140 KiB.
- Security/CSP/caching/404 checks passed. Runtime OCR traffic stayed same-origin.
- Billing verify burst: 30 accepted, 30 returned 429 with `Retry-After: 4`.
  Checkout returned 303 to hosted Dodo.

## Re-run

```bash
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

Then run each exact command in `.factory/claims.json` separately and repeat the
live 1280 × 720 first-read and 1440 × 900 pointer/focus overlap checks.

## Next steps

Repair the desktop hero height, constrain the desktop transcript scroller so
later lines cannot paint beneath following sections, and register or remove the
two untested license promises. Re-run an independent verification after a new
deployment.
