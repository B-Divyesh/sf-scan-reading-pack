# Independent verification 5 — FAIL

**Candidate:** `281b2f339ec5b23c1f57998456b185adf6aa3d42`

**Live URL:** https://scan-reading-pack.sociobot.in

**Verified:** 2026-08-28 from a clean checkout; product code was not changed.

## Decision

**FAIL — do not release.** The deployed files match the candidate, the first-read
gate passes, every listed claim command passes locally, and the core OCR/export
flow works. Fresh production checks nevertheless found these release blockers:

1. **Critical — the live app cannot restore its own project backup.** On
   `/demo/`, export **Back up project**, choose **Start for real**, import an
   invalid JSON file, then retry with the just-exported valid backup. The valid
   restore leaves zero projects, keeps the old error, and logs two CSP errors.
   `restoreBackup()` uses `fetch(data:image/...)`, while production CSP has
   `connect-src 'self' https://api.sociobot.in` and therefore blocks the data
   URL. This directly falsifies the listed `project-backup` claim on the live
   deployment. Its local claim test passes because Vite preview does not apply
   production response headers.
2. **High — five source-coordinate buttons have serious accessible-name
   failures.** Axe's `label-content-name-mismatch` rule reports five serious
   WCAG 2.5.3 findings on `/demo/` at both desktop and 390px. The visible labels
   `P1 · L1` through `P1 · L5` are replaced by accessible names such as “Show
   line 1 on source page,” which do not contain the visible label. Default Axe
   has no serious/critical findings, but the explicit serious rule reproduces
   the defect missed by the brand-only regression.
3. **Critical contract gap — public claims remain unlisted.** The landing page
   says “Changed lines keep their original confidence,” but no claim entry or
   exact test asserts that confidence survives a correction. The privacy page
   also promises individual project deletion and license removal without a
   corresponding claim entry/test. Under the supplied claims contract, an
   unlisted visitor-facing claim is release-blocking.

There is also a medium navigation defect: **How it works** uses `href="#how"`
on `/privacy/`, `/terms/`, and the 404 page, but none of those pages contains
`id="how"`. Each is a dead in-page link instead of linking to `/#how`.

## First-read gate — PASS

A cold live visit answers the required questions in the first viewport:

- **What:** “Make reading packs from scanned pages.”
- **For whom:** readers with scanned books or reports who need selectable text
  linked to the source page.
- **First action:** **Try it with sample data**, accompanied by “Opens a marked
  one-page reading pack.”

The one-click action opens a populated sample. At 390 × 844, the headline,
audience sentence, action, explanation, and all three plain facts are visible
without scrolling. The persistent demo banner says sample data is not saved and
provides **Reset demo** and **Start for real**.

## Required claims gate

`.factory/claims.json` exists with 14 entries. After `npm ci`, every recorded
command was run separately and returned zero. Each tag occurs exactly once in
`tests/e2e/app.spec.ts`.

| Claim | Clean local result | Evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS (desktop + 390px) | Sample, reset, and `demo:scan-reading-pack` asserted. |
| `offline-reload` | PASS (desktop; mobile intentionally skipped) | A later imported scan was OCRed offline after cache warm-up. |
| `source-trace` | PASS (desktop + 390px) | All five sample lines produced a source highlight. |
| `pack-export` | PASS (desktop + 390px) | ZIP files and source coordinates asserted. |
| `browser-private` | PASS (desktop; mobile intentionally skipped) | Actual OCR traffic was restricted to declared same-origin GETs. |
| `no-third-party-runtime` | PASS (desktop + 390px) | Landing traffic was declared same-origin static content only. |
| `scan-import` | PASS (desktop + 390px) | Imported fixture persisted across reload. |
| `scan-file-types` | PASS (desktop; mobile intentionally skipped) | PDF, PNG, JPEG, and WebP fixtures imported. |
| `figure-crop` | PASS (desktop + 390px) | Saved crop appeared in project backup. |
| `correction-queue` | PASS (desktop + 390px) | Checked correction persisted after reload. |
| `project-backup` | **LOCAL PASS; LIVE FAIL** | The preview test restores successfully, but production CSP blocks restoration of the live app's own backup. |
| `local-ocr` | PASS (desktop; mobile intentionally skipped) | Real Tesseract OCR returned the fixture text. |
| `five-page-free-limit` | PASS (desktop + 390px) | Page six was blocked in a free project. |
| `one-time-unlock` | PASS (desktop; mobile intentionally skipped) | Recorded valid entitlement started page-six OCR and added SSML. |

The local pass for `project-backup` does not override the observed deployed
failure. The unlisted public claims above are an independent claims-contract
failure.

## Clean checkout and automated gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 403 packages installed; npm audit found 0 vulnerabilities. |
| `npm test` | PASS — 7/7 Vitest tests in 2 files. |
| `npm run lint` | PASS — TypeScript `--noEmit`; no separate lint command exists. |
| `npm run build` | PASS — exact production build produced `dist/`; PWA precache has 22 entries (624.67 KiB). |
| `npm run test:e2e` | PASS — 32 passed, 8 intentional cross-project skips, 0 failed. |

The full suite covered normal import, all advertised file types, real OCR,
correction persistence, all sample traces, crop/export/backup, free and paid
boundaries, invalid 80 MiB and unsupported input recovery, accessibility,
responsive behavior, and offline operation.

## Live deployment and end-to-end evidence

The deployment is the candidate build. Local `dist/` and live SHA-256 values
matched exactly:

| File | SHA-256 |
| --- | --- |
| `index.html` | `c75391f38f086ba5cecef021f57437314f59c5af7dd806bc983c534930cfc4bf` |
| `sw.js` | `7a27a0b2d8b9c199c99ac4381dde1a2548b49300894fa463f970108e748cc0c1` |
| `manifest.webmanifest` | `7a7e0bfc1c4975bf73c69585c6f5d9dddd813df5840e0ea5219bbf882bfb414b` |
| `assets/main-DWMNH8ZH.js` | `4f2f174ca8b74edebfe382d3036ec87a265608e6571132137d29dd413ac8edb2` |
| `assets/main-BYX6JlcS.css` | `5dce010a961df432a39aba2a6d445e49e4242247c7242b6d7146e9be6da94739` |

`verify-url.sh` passed the live root: HTTP 200, title, `lang=en`, one H1,
main landmark, complete image alt text, labelled buttons, and no console errors
(`loadMs: 777`).

A fresh live personal flow recovered from an unsupported text file, imported
the shipped scan, performed real local OCR (`THE NIGHT READING ROOM`), saved a
correction across reload, highlighted its source region, cropped a figure, and
downloaded a ZIP. The ZIP contained Markdown, plain text, HTML, source map,
source page, and WebP crop; the source map retained the corrected text and
coordinates. Every request in that flow was a same-origin GET and there were
no console/page errors.

Demo isolation also passed independently: a seeded private project was absent
from `/demo/`; leaving the demo removed `demo:scan-reading-pack` and revealed
the unchanged personal `scan-reading-pack` database.

## Accessibility, mobile, keyboard, and motion

- Default Playwright Axe scans of `/`, `/demo/`, `/privacy/`, `/terms/`, and a
  designed 404 at desktop and 390px found 0 serious/critical violations. The
  explicit experimental label-in-name scan found the five serious demo issues
  described above.
- Each route has `lang=en`, one H1, one main landmark, complete image alt text,
  and no horizontal overflow. The unknown route returns HTTP 404.
- All 26 visible demo links, buttons, and file labels at 390px measure at least
  44 × 44 CSS px. At 200% root text, document width remains 390px.
- Keyboard Tab reaches the skip link first. Its cyan outline is 3px; Enter
  focuses `main`. Enter on a trace button produces the source highlight. No
  keyboard trap was found.
- Under reduced motion, smooth scrolling becomes `auto`, transitions are `0s`,
  and animation duration is effectively disabled (`0.01ms`).

## Privacy, PWA, policies, billing, and performance

- Cold, demo, and real-OCR traffic used only the product origin. No analytics,
  tracker, remote font, CDN, upload, non-GET OCR request, or embedded secret was
  observed. Billing traffic occurs only after an explicit license action.
- The live service worker controls the site and `registration.update()` leaves
  an activated worker. The generated worker accepts `SKIP_WAITING`, claims
  clients, and the app provides an **Update now** prompt when a worker waits.
  No second deployed version existed to force that prompt.
- Offline reload shows “You’re offline”; a second scan imported after going
  offline was OCRed successfully from `workbox-precache` and `ocr-assets-v1`.
- Chrome reports no manifest parsing or installability errors. The manifest has
  192/512 and maskable icons, standalone display, scope, id, versioned start
  URL, and matching theme colors.
- Root and route responses include CSP, HSTS, `nosniff`, frame denial,
  referrer, and permissions policies. Hashed assets are immutable-cached;
  HTML/SW/manifest revalidate after 30 seconds; unknown routes return HTTP 404.
- The Sociobot checkout endpoint returned HTTP 303 to hosted Dodo checkout.
  Verify CORS allows the product origin. In a fresh 60-request burst, requests
  1–30 returned 200 and request 31 onward returned 429; the first 429 included
  `Retry-After: 3`.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.2 s, LCP 1.5 s, TBT 80 ms, CLS 0, total transfer 140 KiB.
  The separate experimental serious Axe result remains a blocker.
- Built initial authored JS is 50.81 kB raw (19.45 kB gzip), CSS is 20.43 kB
  raw (5.28 kB gzip), fonts total 60.90 kB, and AVIF hero 37.06 kB. Deferred
  PDF/OCR assets do not enter the cold landing budget.

The product is a static PWA with no application backend or sign-in. Backend
concurrency/health/persistence and Entra checks are not applicable. The only
server-side product call is the Sociobot unlock endpoint, whose rate limit is
recorded above. Library/CLI consumer packaging is also not applicable.

## Required repair before re-verification

1. Restore data URLs without a network `fetch()` blocked by CSP (for example,
   decode them locally), or narrowly align production CSP with the reviewed
   implementation. Add a production-header E2E that exports and restores the
   same backup.
2. Include each visible `P1 · Lx` string in its trace button accessible name,
   then run the label-in-name rule over the whole workbench.
3. Add exact claim entries/tests for confidence preservation and the advertised
   deletion controls, or remove/narrow those public statements.
4. Point legal/404 **How it works** links to `/#how`.
