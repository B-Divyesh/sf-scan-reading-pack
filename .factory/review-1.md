# Review 1 — Make reading packs from scanned pages

**Verdict: FAIL**

- Findings: **2** — Critical 1, High 0, Medium 1, Low 0
- Untested public claims: **1**
- Live URL: https://scan-reading-pack.sociobot.in
- Reviewed: 2026-09-05
- Implementation SHA: `ba261605b5840789e6c37a8b9db13a52e03955f1`
- Deployment-evidence SHA: `b103da07ccafc184d7bb60c6d1668ba19b7a0226`
- Documentation SHA reviewed: `bd5dafe10a42ba610d3cf8bb9fd67ae941963364`

`b103da0` and `bd5dafe` change only factory reports and evidence after the
implementation commit. A clean build at `bd5dafe` therefore reviews the
product implementation at `ba261605`. The live HTML, manifest, service worker,
main JavaScript, and main CSS match that clean build byte for byte.

## First screen

A fresh 1280 × 720 desktop browser and a fresh 390 × 844 phone browser show all
of this before scrolling:

- Job: **“Make reading packs from scanned pages.”**
- Audience: **“For readers with scanned books or reports who need selectable
  text linked to its source page.”**
- First action: **“Try it with sample data.”**
- What the action does: **“Opens a marked one-page reading pack.”**
- Facts: the sample has its own workspace, pages stay in the browser, and
  cached OCR works offline.

The words are direct and use the same terms as the product. The phone and
desktop screenshots are in
[`qa-artifacts/review-1`](qa-artifacts/review-1/).

## Sample flow and real work

The first action opened `/demo/` in one click. The page immediately showed the
five-line “Night Reading Room” sample, confidence scores, source page, and the
persistent **“Demo — sample data, nothing is saved to your library”** label.

The live checks then proved all of these outcomes:

- Every `P1 · L1` through `P1 · L5` control accepted a pointer click, showed a
  visible 3px focus ring, selected its text line, and highlighted the matching
  source region.
- The 78% line accepted a correction. The downloaded reading-pack ZIP kept
  the corrected text, the original 78% confidence, and numeric page
  coordinates.
- The ZIP contained `README.txt`, Markdown, plain text, HTML,
  `source-map.json`, and the source page.
- **Reset demo** restored the original line. The sample label remained visible
  after editing, export, and reset.
- The personal IndexedDB keys were unchanged throughout the sample. Leaving
  the sample deleted `demo:scan-reading-pack` and preserved
  `scan-reading-pack`.
- A project backup exported from the sample restored successfully on the live
  site after an invalid backup attempt. This directly rechecks the earlier CSP
  restore defect.
- An over-80 MiB image and an unsupported text file produced specific errors.
  The shipped PNG then imported, cleared the stale error, and completed real
  browser OCR with recognizable “NIGHT” or “READING” text.
- A fresh invalid license was rejected in plain words. Only the declared
  Sociobot billing API was contacted for that explicit action.

All work used fresh disposable browser contexts. No account or server-side
product state exists, and no visitor data was read or changed.

## Public claims

`.factory/claims.json` contains 18 entries. Each `@claim:<id>` tag occurs
exactly once. Every stored command was run separately after `npm ci` in the
clean checkout.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS | Populated sample, reset, direct demo URL, separate IndexedDB |
| `offline-reload` | PASS | A later import completed OCR after the browser went offline |
| `source-trace` | PASS | All five sample lines showed their source regions |
| `pack-export` | PASS | ZIP contents and source coordinates were inspected |
| `browser-private` | PASS | Real import and OCR used declared same-origin GET requests |
| `no-third-party-runtime` | PASS | Landing traffic contained no tracker, CDN, or remote font |
| `scan-import` | PASS | Imported scan remained after reload |
| `scan-file-types` | PASS | PDF, PNG, JPEG, and WebP each opened as a page |
| `figure-crop` | PASS | Saved crop appeared in the project backup |
| `correction-queue` | PASS | Checked low-confidence correction survived reload |
| `confidence-preservation` | PASS | Corrected 78% line remained 78% in backup |
| `project-backup` | PASS | Backup exported and restored after an invalid retry under CSP |
| `local-deletion` | PASS | Project and saved license keys were removed |
| `local-ocr` | PASS | Actual Tesseract OCR read the shipped scan |
| `five-page-free-limit` | PASS | Page six was blocked in the free edition |
| `one-time-unlock` | PASS | Checkout target, page-six OCR, and SSML were proved with a recorded valid verdict |
| `daily-license-check` | PASS | No request just inside 24 hours; one just outside; no duplicate after reload |
| `refund-revocation` | PASS | Recorded revoked verdict removed paid access and SSML |

Landing, legal, demo, and README statements were compared with this manifest.
All 18 declared claims are tested, but the cross-check found one additional
unlisted quality claim: **“Desktop-quality unlock.”** It has no measurable
meaning or sandbox test. The claims contract requires this phrase to be
removed or replaced with a concrete tested statement.

## Clean checkout gates

The clean checkout was `/work/scan-reading-pack-review-1-clean` at
`bd5dafe10a42ba610d3cf8bb9fd67ae941963364`.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 403 packages installed |
| All 18 exact claim commands | PASS |
| `npm test` | PASS — 13/13 |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/index.html` and 22-entry PWA precache produced |
| `npm run test:e2e` | PASS — 46 passed, 12 documented cross-project skips, 0 failed |

The current npm advisory feed reports one moderate advisory for
`fflate@0.8.2` affecting `unzipSync` on malformed ZIP64 input. This is not a
product finding: the shipped app imports only `zipSync` and does not accept ZIP
files. `unzipSync` appears only in tests that inspect the app's own export.
Updating to `fflate@0.8.3` is still sensible routine maintenance.

## Accessibility, phone, keyboard, and routes

- The worker `verify-url.sh` passed live in 661ms: correct title and language,
  one H1, one main landmark, complete alt/control names, and no console errors.
- Playwright Axe found zero serious or critical issues on `/`, `/demo/`,
  `/privacy/`, `/terms/`, and the designed 404 at desktop and phone sizes.
  The experimental label-in-name rule also passed every route.
- The skip link is the first keyboard stop, moves focus to `main`, and has a
  solid 3px cyan outline. All five trace controls are pointer and keyboard
  reachable without overlap.
- The phone demo had 26 visible controls; the smallest dimension was 44px.
  It had no horizontal overflow. The landing page still reflowed at 200% text.
- Reduced motion changed transitions to `0s` and scroll behavior to `auto`.
- Route titles are specific. Internal links resolve. Privacy and Terms return
  200. The intentionally unknown URL returns HTTP 404 with one H1, `main`, the
  common header/footer, and a route back. That expected HTTP 404 is not a
  defect.

## Privacy, offline use, security, and performance

- The audited live landing, sample, backup, import, and OCR flow made 26
  non-blob requests. Every one was a same-origin GET. There were no console or
  page errors. Billing traffic occurred only after the explicit license check.
- The service worker controlled a fresh context. `registration.update()`
  completed with an activated worker, and the populated sample reloaded
  offline with the offline notice.
- Root responses include CSP, HSTS, `nosniff`, frame denial, strict referrer,
  and restrictive permissions policies. Hashed JavaScript and CSS use a
  one-year immutable cache; HTML, worker, and manifest revalidate in 30
  seconds.
- The buy link returned the expected 303 redirect to hosted checkout. This is
  a static local-first PWA with no product backend, tenant, login, or server
  database. Backend restart, health, tenant, and concurrency checks do not
  apply. The earlier rate-limit evidence remains documentation-only and is not
  a public product claim.
- Fresh mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.20s, LCP 1.65s, TBT 1ms, CLS 0.00013, transfer 143,284
  bytes.
- Initial authored main JavaScript is 51,338 bytes raw, the Workbox window
  helper is 5,714 bytes raw, CSS is 20,810 bytes raw, fonts total 60,896
  bytes, and the hero AVIF is 37,063 bytes. Deferred OCR/PDF code is outside
  the first load.

## Live build identity

| File | SHA-256 | Result |
| --- | --- | --- |
| `index.html` | `ce17c207c8e9a447aa1c9277f69e70638b1361c37295ab2f9fb90e0086e7bdbe` | MATCH |
| `manifest.webmanifest` | `4d973d3087c913d1b81a93c91a7a7ed6577cc3ab1e7604765905858fcef0097d` | MATCH |
| `sw.js` | `48cc45db44873704c9af67db395244e2cf67fa391aa286ed7371fa431eb48682` | MATCH |
| `assets/main-bN7WI4bP.js` | `427a9cc76dcffc61fd0b6268821ec03e26ab3d95f0c45d855d679cdd84aff143` | MATCH |
| `assets/main-hfVH82jE.css` | `e0db26c32d5a9d1a9447333817d62dcd07b7bf0f499c0a7f8b47a942f2981080` | MATCH |

## Earlier findings

| Earlier review | Current disposition and proof |
| --- | --- |
| Verification 1: no claims or sample; weak first screen; missing CSP/cache/metadata/404 | CLOSED — 18 exact claims pass; one-click isolated sample and complete first read are live; headers, immutable assets, metadata, and real 404 pass |
| Verification 2: incomplete free/paid claims; small targets; stale import alert | CLOSED — page-six/SSML tests pass; live minimum target is 44px; invalid-to-valid recovery clears the alert |
| Verification 3: unlisted capabilities; full-suite flakiness | CLOSED — public copy maps to 18 claims; fresh full suite passed 46/12 with no failure |
| Verification 4: narrow privacy/offline/trace tests; small demo controls; label mismatch; 200% overflow; handled console error | CLOSED — real OCR privacy/offline tests pass; every trace is tested; touch, label-in-name, reflow, and console checks pass live |
| Verification 5: live backup restore blocked by CSP; trace label mismatch; unlisted confidence/deletion claims; dead How it works links | CLOSED — live invalid-then-valid backup restore passed under CSP; labels and links pass; both claims are registered and pass |
| Verification 6: first action below 1280 × 720 fold; covered trace controls; missing daily/revocation claims | CLOSED — all first-read elements fit; five trace controls own pointer hits and focus; both exact entitlement claims pass |
| Verification 7: no defects | FUNCTIONAL RESULT CONFIRMED — its test and live results reproduce, but this review found the separate copy and claim gaps below |

## Findings

### Critical — unlisted and untestable public claim

1. **“Desktop-quality unlock” is a public quality claim with no claim entry or
   observable test.** It appears above the paid section on the landing page.
   “Desktop-quality” has no defined outcome, measure, or sandbox assertion.
   The claims contract says an unlisted claim fails review, and an untestable
   claim must be removed rather than left as marketing copy. The current 18
   commands all pass, but none can prove this nineteenth statement.

### Medium — metaphor and decorative headings break the plain-words contract

1. **Several public headings and labels use the exact style the supplied
   plain-words contract bans.** Examples include **“Verifiable OCR workshop,”**
   **“From image to evidence,”** **“Free for a chapter. One-time for the
   shelf.”**, and the 404 H1 **“This page is not on the workbench.”** These are
   workshop/shelf metaphors or decorative labels rather than direct section or
   error names. The mandated copy audit does not catch them: `.factory/copy-audit.md`
   lists only seven first-screen/revocation lines and omits most landing
   headings, body sentences, empty-state text, pricing text, and footer copy.
   Replace the metaphorical headings with literal names, then regenerate the
   complete landing-page sentence audit required by the contract.

## Final decision

**FAIL.** Finding count is **2** and untested claim count is **1**. The tested
product paths work, but the claims and plain-words contracts do not allow a
PASS with these public-copy gaps. No product code was changed during this
review.
