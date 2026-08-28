# Independent verification 6 — FAIL

**Candidate:** `99b85bcc7f0fca2a58fa9f282fcaa87609e802ae`

**Live URL:** https://scan-reading-pack.sociobot.in

**Verified:** 2026-08-28 from the supplied checkout; product code was not changed.

## Decision

**FAIL — do not release.** The live deployment matches the candidate, all 16
listed claim commands pass, the production build succeeds, and the main local
OCR/export/offline paths work. Fresh viewport and claims-contract checks found
three release blockers:

1. **Critical — the mandatory desktop first-read gate fails at 1280 × 720.**
   The headline is visible, but the audience sentence begins at y=710 and ends
   at y=780, so it is not readable in the 720px viewport. **Try it with sample
   data** begins at y=812 and is completely below the fold. A cold visitor
   therefore cannot tell who the product is for or what to click first without
   scrolling. This is the repository's own `Desktop Chrome` viewport. Evidence:
   [`live-first-read-desktop-1280x720.png`](qa-artifacts/verification-6/live-first-read-desktop-1280x720.png).
2. **High — workbench content and focus are covered at 1440 × 900.** In the
   five-line sample, `.blocks` expands to 1,115px inside a 725px workbench.
   The following `.project-foot` is painted over line 4. Its `P1 · L4`
   coordinate button occupies y=460.8–504.8 while the project panel occupies
   y=447.5–545.5. `elementFromPoint()` returns `.project-foot`, and a real
   Playwright pointer click times out. Keyboard Tab reaches the button and
   Enter activates it, but its 3px focus ring is hidden, violating the visible
   focus requirement. The adjacent **Show on scan** action remains usable, so
   this is not total data loss. Evidence:
   [`live-desktop-overlap.png`](qa-artifacts/verification-6/live-desktop-overlap.png).
3. **Critical claims-contract gap — quantitative/payment promises are not in
   `.factory/claims.json`.** The licensed landing state says a license is
   “rechecked at most once a day,” and Terms says approved refunds revoke the
   associated license automatically. Neither promise has a claim entry or an
   exact `@claim:` sandbox test. The existing `one-time-unlock` test injects a
   fresh cached verdict; it does not test the 24-hour request boundary or a
   revoked/refunded verdict. The supplied claims contract makes any unlisted
   visitor-facing claim release-blocking.

## First-read gate

The copy itself is plain:

- **What:** “Make reading packs from scanned pages.”
- **For whom:** readers with scanned books or reports who need selectable text
  linked to its source page.
- **First action:** **Try it with sample data**, with “Opens a marked one-page
  reading pack.”

At 390 × 844, all three and the privacy/offline facts fit: H1 y=163–284,
audience y=308–392, action y=424–504, facts y=618–688. At 1440 × 900, the
action also fits. At 1280 × 720, the audience and action do not; the required
first-read result is therefore **FAIL**. The action itself works in one click
once reached and opens the populated demo.

## Required claims gate

`.factory/claims.json` exists with 16 entries. After `npm ci`, every stored
command was run separately and returned zero.

| Claim | Result | Evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS | 2 browser cases passed; sample, reset control, and demo IndexedDB asserted. |
| `offline-reload` | PASS | 1 passed, duplicate mobile OCR case intentionally skipped. |
| `source-trace` | PASS in declared sandbox | 2 passed; note the independent 1440px pointer obstruction above. |
| `pack-export` | PASS | 2 passed; live ZIP contained Markdown, text, HTML, source map, and source page. |
| `browser-private` | PASS | 1 passed, duplicate mobile OCR case intentionally skipped. |
| `no-third-party-runtime` | PASS | 2 passed. |
| `scan-import` | PASS | 2 passed; persistence after reload asserted. |
| `scan-file-types` | PASS | 1 passed, duplicate mobile format matrix intentionally skipped. |
| `figure-crop` | PASS | 2 passed; independent live crop also saved. |
| `correction-queue` | PASS | 2 passed; correction survived reload. |
| `confidence-preservation` | PASS | 2 passed; corrected 78% line retained 78%. |
| `project-backup` | PASS | 2 passed; valid backup recovered after invalid input under production CSP. |
| `local-deletion` | PASS | 2 passed; project and both license keys removed. |
| `local-ocr` | PASS | 1 passed, duplicate mobile OCR case intentionally skipped. |
| `five-page-free-limit` | PASS | 2 passed; page six blocked. |
| `one-time-unlock` | PASS as scoped | 1 passed, duplicate mobile entitlement case intentionally skipped; page six started and SSML exported with a recorded valid verdict. |

The listed tests pass, but the two unlisted promises in finding 3 independently
fail the claims contract.

## Clean install and repository gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 403 packages installed; 0 audit vulnerabilities. |
| `npm test` | PASS — 12/12 Vitest tests in 3 files. |
| `npm run lint` | PASS — TypeScript `--noEmit`. |
| `npm run build` | PASS — exact production build produced `dist/`; PWA precache has 22 entries (625.03 KiB). |
| `npm run test:e2e` | PASS — 40 passed, 8 documented cross-project skips, 0 failed. |

The complete browser suite covers both configured projects: Desktop Chrome and
390px mobile. It includes image/PDF formats, 80 MiB and unsupported-file
boundaries, invalid-input recovery, real local OCR, correction persistence,
trace, crop, ZIP/backup, deletion, free/paid page boundaries, privacy traffic,
production CSP, real 404 responses, and offline operation.

## Live product flow

- The one-click demo loaded “The Night Reading Room,” a real five-line sample,
  with the persistent demo banner, **Reset demo**, and **Start for real**.
- Demo isolation passed: with one personal project already stored, `/demo/`
  contained one personal record only in `scan-reading-pack` and one sample only
  in `demo:scan-reading-pack`. **Start for real** deleted the demo database and
  left the personal project visible.
- Invalid backup JSON produced the specific recovery message. Importing the
  valid backup immediately afterward restored one project and cleared the
  stale alert with no CSP/console error.
- Unsupported text input produced an error; the shipped PNG then imported and
  cleared it. Live Tesseract OCR returned `THE NIGHT READING ROOM`.
- A live figure crop saved. The reading-pack ZIP contained `README.txt`,
  `reading.md`, `reading.txt`, `reading.html`, `source-map.json`, and
  `source-pages/page-1.webp`. Its first source-map entry retained confidence
  99 and `{x0:115,y0:145,x1:940,y1:220}`.
- The full audited flow made 36 same-origin GETs, zero external runtime
  requests, zero non-GET requests, and logged no console/page errors.
- An invalid license entered through the UI called only the Sociobot verify
  endpoint and displayed “That license is invalid.” A returned license query
  was stored under `sb_license:scan-reading-pack` and removed from the URL.

## Accessibility, responsive behavior, and motion

- Playwright Axe 4.10.2 on `/`, `/demo/`, `/privacy/`, `/terms/`, and the 404
  route at desktop and 390px found zero serious/critical findings. The explicit
  experimental label-in-name scan also found zero violations.
- The standalone Axe CLI could not discover the preinstalled Playwright Chrome
  binary in this container; the equivalent Playwright Axe integration ran
  successfully on all routes and the populated workbench.
- Each route has `lang=en`, one H1, one main landmark, complete image alt text,
  and no horizontal overflow. At 200% root text, `/` and `/demo/` remain 390px
  wide without horizontal overflow.
- The skip link is the first Tab stop and has a 3px cyan focus outline. The
  line-4 hidden-focus defect is documented above. Mobile demo targets measured
  at least 44 × 44 CSS pixels.
- With reduced motion, scroll behavior is `auto`, transition duration is `0s`,
  animation duration is `0.01ms`, and the hero transform is removed.
- The designed 404 returns HTTP 404. Its navigation error appears in Chromium
  as the expected failed-document console message; normal routes have no
  console or page errors.

## Deployment identity, security, PWA, and performance

The deployed product matches the candidate's freshly generated `dist/`
byte-for-byte:

| File | SHA-256 |
| --- | --- |
| `index.html` | `2a840f75040643f767a6d6f634622939bbbae46c93b38708749d22f043feb736` |
| `sw.js` | `9028169692e3b7df88108761389fbd7152d9b05fa42208f4fd0a290df191e3df` |
| `manifest.webmanifest` | `6e290bb704ebf004ae7275b335cb242289f6f9766f57f4de6b2c2d6845448794` |
| `assets/main-ScrXwHhC.js` | `6f832a29afeea61135ea027da13131a18b49913b82ceb0bd34dca5abc3f354ef` |
| `assets/main-BYX6JlcS.css` | `5dce010a961df432a39aba2a6d445e49e4242247c7242b6d7146e9be6da94739` |

- The required `verify-url.sh` passed live: HTTP 200, 681ms load, correct title,
  `lang=en`, one H1/main, complete alt/control names, and no errors.
- Root policy includes CSP, HSTS, `nosniff`, frame denial, strict referrer, and
  permissions headers. Hashed assets use one-year immutable caching;
  HTML/service worker revalidate after 30 seconds. Unknown routes return 404.
- No embedded secrets, trackers, analytics, remote fonts, or runtime CDNs were
  found. Normal/OCR traffic stayed same-origin; billing occurs on explicit
  license actions.
- The service worker controlled the live page, remained activated after
  `registration.update()`, and reloaded the shell offline. After one online OCR
  warmed the caches, a newly imported local image also OCRed successfully while
  offline. No second deployed worker existed to force the update toast.
- Manifest fields include standalone display, scoped/versioned start URL,
  matching theme colors, 192/512 icons, and a maskable 512 icon.
- Live Lighthouse mobile: Performance 91, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.2s, LCP 1.7s, TBT 350ms, CLS 0, total transfer 140 KiB.
  Initial authored JS is 51.18 kB raw plus 5.71 kB Workbox (22.07 kB gzip
  combined); CSS is 20.43 kB raw / 5.29 kB gzip; fonts total 60.90 kB; mobile
  hero AVIF is 37.06 kB. Deferred PDF/OCR assets are not cold-load resources.
- A 60-request parallel burst to the Sociobot verify endpoint accepted 30 and
  rate-limited 30 with HTTP 429 and `Retry-After: 4`; the observed burst
  capacity was 30. Verify CORS echoed the product origin. Checkout returned
  HTTP 303 to the hosted Dodo checkout.

This is a static local-first PWA with no application backend or sign-in.
Backend concurrency/health/persistence, Entra identity, and library/CLI
consumer-install checks are not applicable.

## Required repair before re-verification

1. Make the desktop hero fit the audience sentence, sample action, action note,
   and three facts in the first viewport at the supported desktop baseline.
   Add bounding-box assertions against `window.innerHeight`; CSS visibility is
   not sufficient.
2. Constrain desktop `.text-panel`/`.blocks` to the workbench row (`min-height:
   0` on the grid/flex item is one likely correction) so project/footer content
   never overlays transcript controls. Add pointer-hit and visible-focus tests
   for every sample line at 1440 × 900.
3. Add exact claims and sandbox tests for the 24-hour license-check interval and
   refund/revocation behavior, or remove/narrow those visitor-facing promises.
