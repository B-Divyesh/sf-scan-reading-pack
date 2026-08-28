# Independent verification 7 — PASS

**Candidate:** `b103da07ccafc184d7bb60c6d1668ba19b7a0226`<br>
**Live URL:** https://scan-reading-pack.sociobot.in<br>
**Verified:** 2026-08-28 from a clean checkout; product source was not changed.

## Release decision

**PASS.** The live deployment matches this candidate's fresh production output for the HTML, manifest, main JavaScript, main CSS and sampled static assets. The required claims manifest exists and every listed command passes independently from the demo entry point. No release-blocking defect was found.

## Required first checks

### Claims gate

`.factory/claims.json` is present and contains 18 claims. After `npm ci`, I ran every exact `test` command listed in it separately (each invokes the production build and Playwright). `demo-sandbox`, `offline-reload`, `source-trace`, `pack-export`, `browser-private`, `no-third-party-runtime`, `scan-import`, `scan-file-types`, `figure-crop`, `correction-queue`, `confidence-preservation`, `project-backup`, `local-deletion`, `local-ocr`, `five-page-free-limit`, `one-time-unlock`, `daily-license-check`, and `refund-revocation` all passed.

This covers the sample sandbox, online-then-offline OCR, all announced input formats, traceability, correction persistence, exports/backups, deletion, the free five-page boundary, paid SSML/unlimited pages, daily license cache, and revocation.

### Cold live first-read

A fresh uncached desktop visit returned HTTP 200 and showed:

- **What:** “Make reading packs from scanned pages.”
- **For whom:** “For readers with scanned books or reports who need selectable text linked to its source page.”
- **First action:** the visible, one-click **Try it with sample data** link, with “Opens a marked one-page reading pack.”

The same first screen states that the sample is separate, pages stay in the browser, and cached OCR works offline. This passes the plain-words and demo-sandbox gate.

## Clean local gates

| Check | Result | Fresh evidence |
| --- | --- | --- |
| Install | PASS | `npm ci`: 403 packages, 0 vulnerabilities |
| Unit/integration | PASS | `npm test`: 13/13 Vitest tests passed |
| Type/lint | PASS | `npm run lint` (`tsc --noEmit`) passed |
| Production build | PASS | `npm run build` passed and produced `dist/`; PWA precache: 22 entries / 625.55 KiB |
| Full browser suite | PASS | `npm run test:e2e`: 46 passed, 12 documented project skips, 0 failed (58 cases) |
| Claim suite | PASS | all 18 exact commands above passed independently |

The full suite exercised representative imports, actual browser OCR, PDF/PNG/JPEG/WebP handling, invalid-import recovery, corrections and confidence preservation, figure extraction, source trace, ZIP/project-backup export and restore, local deletion, demo isolation, paid/free boundary handling, offline reload, keyboard focus, 44px mobile targets, 200% text reflow, CSP/404 policy, and both desktop Chromium and 390px mobile.

## Independent live/product checks

- **End to end:** at `/demo/`, each of the five sample lines selected its matching `.source-highlight`; the low-confidence line accepted an edit; the live app downloaded `the-night-reading-room-sample-reading-pack.zip`; no console or page errors occurred.
- **Privacy:** Playwright recorded only the product origin (plus same-origin `blob:` image use) across landing and demo use. No analytics, tracker, remote font, runtime CDN, upload, or telemetry request appeared. The claim regression additionally performs a real import/OCR request audit.
- **Accessibility:** the required `verify-url.sh` passed against live in 785ms: title, `lang=en`, one H1, main landmark, image alts and control names are present; zero console errors. Axe had zero serious/critical findings on live landing/demo and the local full suite covers `/`, `/demo/`, `/privacy/`, `/terms/`, and the real 404 at desktop and 390px. Keyboard Tab reaches the skip link with a visible `3px solid rgb(80, 231, 242)` focus ring. At 390px, `scrollWidth` equals `clientWidth` (390), with no horizontal overflow.
- **PWA:** local production preview registered and controlled the service worker; `/demo/` reloaded offline after first load and still showed its H1; `registration.update()` completed successfully.
- **Headers/caching:** live root has CSP, HSTS, nosniff, DENY frame policy, strict referrer policy and a restrictive permissions policy. The hashed main JS and self-hosted font return `Cache-Control: public, max-age=31536000, immutable`; the HTML/SW/manifest revalidate in 30 seconds; an unknown route returns HTTP 404.
- **Budget:** initial authored JS is 19,660 bytes gzip and initial CSS 5,366 bytes gzip; the hero AVIF is 37,063 bytes. These are within the static/PWA budgets. Large OCR/PDF assets are deferred and are not first-load scripts.
- **License endpoint allowance:** the Sociobot verify route was tested sequentially with fresh invalid tokens. Requests 1–30 returned 200; request 31 returned `429` with `Retry-After: 4` and `x-ratelimit-after: 4`. Observed allowance: 30 verification requests per client window. The app has no product-owned server endpoint and no sign-in flow, so backend concurrency, persistence-boundary and Entra checks do not apply.

## Deployment identity

Fresh local build and live SHA-256 values match:

| File | SHA-256 |
| --- | --- |
| `index.html` | `ce17c207c8e9a447aa1c9277f69e70638b1361c37295ab2f9fb90e0086e7bdbe` |
| `manifest.webmanifest` | `4d973d3087c913d1b81a93c91a7a7ed6577cc3ab1e7604765905858fcef0097d` |
| `assets/main-bN7WI4bP.js` | `427a9cc76dcffc61fd0b6268821ec03e26ab3d95f0c45d855d679cdd84aff143` |
| `assets/main-hfVH82jE.css` | `e0db26c32d5a9d1a9447333817d62dcd07b7bf0f499c0a7f8b47a942f2981080` |

The local `sw.js` SHA-256 is `48cc45db44873704c9af67db395244e2cf67fa391aa286ed7371fa431eb48682`.

## Defects by severity

None found: Critical 0, High 0, Medium 0, Low 0.

## Evidence

The live `verify-url.sh` response, JSON report and desktop/mobile screenshots are in [`qa-artifacts/verification-7/verify-url`](qa-artifacts/verification-7/verify-url/).
