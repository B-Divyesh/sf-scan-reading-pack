# Verification 8 — Make reading packs from scanned pages

**Verdict: PASS**

- Findings: **0** — Critical 0, High 0, Medium 0, Low 0
- Untested public claims: **0**
- Live URL: https://scan-reading-pack.sociobot.in
- Verified: 5 September 2026
- Implementation reviewed: `f6e785b7ca64fa9d28a4e18a97c8636e9ae1c1f3`
- Documentation reviewed: `307f05a9ec8e3bda1162b3c1979d8d8dce9bef5b`

The commits after `f6e785b7` contain only factory documentation and evidence.
The deployed HTML, manifest, service worker, main JavaScript, and main CSS
match a clean build at `307f05a`, so the live product is the requested
implementation candidate.

## First screen

Fresh 1280 × 720 desktop and 390 × 844 phone profiles showed this before any
scrolling:

- Job: **“Make reading packs from scanned pages.”**
- Audience: **“For readers with scanned books or reports who need selectable
  text linked to its source page.”**
- First action: **“Try it with sample data.”**
- Result of that action: **“Opens a marked one-page reading pack.”**
- Facts: the sample uses its own workspace, pages stay in the browser, and
  cached OCR works offline.

The last fact ended at y=632 on desktop and y=688 on phone. The desktop and
phone widths were 1280/1280 and 390/390, with no horizontal overflow. Evidence
is in [`qa-artifacts/verification-8`](qa-artifacts/verification-8/).

## Live sample and normal work

The first action opened `/demo/` in one click. The first populated view showed
the one-page “Night Reading Room” sample, five recognized lines, confidence
scores, and the persistent **“Demo — sample data, nothing is saved to your
library”** label.

- Every `P1 · L1` through `P1 · L5` control selected its line and displayed the
  matching source highlight.
- A correction to the 78% line appeared in downloaded Markdown. The source map
  retained the line identifier and page coordinates.
- The ZIP contained `README.txt`, Markdown, plain text, HTML, a source map, and
  the source page.
- The demo label stayed visible after the edit, export, and reset. **Reset
  demo** restored the original line.
- The demo database contained one project while the personal database
  contained none. **Start for real** removed the demo database and left the
  empty personal database unchanged.
- The phone demo exposed 26 visible controls. None measured below 44 × 44 CSS
  pixels.

No account, remote product state, or existing user data was accessed or
changed.

## Public claims

`.factory/claims.json` contains 18 entries. Each tag occurs exactly once in the
browser suite. From a fresh clone at `307f05a`, I ran every stored `test`
command separately; all passed.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS | Two viewports loaded the sample, reset it, and used the separate demo database. |
| `offline-reload` | PASS | A later scan completed real OCR after the context went offline. |
| `source-trace` | PASS | All five sample lines revealed their source regions in both viewports. |
| `pack-export` | PASS | Both viewports downloaded the ZIP and verified text files and source coordinates. |
| `browser-private` | PASS | Real import and OCR used only declared same-origin GET and local blob requests. |
| `no-third-party-runtime` | PASS | Both landing runs used only declared self-hosted resources. |
| `scan-import` | PASS | The imported fixture persisted after reload in both viewports. |
| `scan-file-types` | PASS | PDF, PNG, JPEG, and WebP fixtures each opened as a ready page. |
| `figure-crop` | PASS | Both viewports saved a WebP crop in the project backup. |
| `correction-queue` | PASS | A checked low-confidence correction persisted after reload. |
| `confidence-preservation` | PASS | The corrected 78% line retained its original 78% confidence. |
| `project-backup` | PASS | Both viewports exported and restored a backup after invalid input under production CSP. |
| `local-deletion` | PASS | A personal project and saved license keys were removed. |
| `local-ocr` | PASS | Tesseract read “THE NIGHT READING ROOM” from the shipped scan. |
| `five-page-free-limit` | PASS | Page six was stopped in the free edition. |
| `one-time-unlock` | PASS | The $19 checkout target, page-six OCR, and SSML export passed with a recorded valid verdict. |
| `daily-license-check` | PASS | No request occurred just inside 24 hours, one occurred just outside, and reload did not duplicate it. |
| `refund-revocation` | PASS | A recorded revoked verdict removed paid access, SSML, and page-six OCR. |

Landing, demo, legal, README, empty, error, paid, and recovery copy were
cross-checked against the manifest. The removed “Desktop-quality unlock” text
is absent. Rendered route tests also found none of the rejected metaphors or
banned marketing terms. There are **zero untested public claims**.

## Clean checkout gates

The clean checkout was `/work/srp-v8-clean-hgjdlH` at documentation commit
`307f05a9ec8e3bda1162b3c1979d8d8dce9bef5b`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 403 packages installed; 0 vulnerabilities |
| Every exact claim command | PASS — 18/18, run separately |
| `npm test` | PASS — 13/13 |
| `npm run lint` | PASS — TypeScript `--noEmit` |
| `npm run build` | PASS — `dist/index.html`; 22-entry, 625.68 KiB precache |
| `npm run test:e2e` | PASS — 49 passed, 11 intentional project skips, 0 failed |

The full suite covered desktop Chromium and the 390px phone project. Skips
avoid repeating resource-heavy OCR, format, and entitlement matrices in the
second viewport; the shared UI paths still run in both.

## Invalid, boundary, and recovery paths

- A live invalid backup produced the specific backup error. Retrying with the
  app's own valid backup restored one project, removed the old alert, and
  logged no CSP or application error.
- A live 80 MiB-plus image produced the size limit. An unsupported text file
  produced the supported-format guidance. Retrying with the shipped PNG
  cleared the alert and completed real browser OCR.
- Local claim runs covered all four import types, figure boundaries, the
  five-page free boundary, paid page six, invalid and revoked licenses, and
  backup/deletion recovery.
- The live hosted checkout entry returned the expected redirect. No paid
  transaction was made; valid, daily-cache, and revoked paths used recorded
  gateway responses as specified.

## Accessibility, keyboard, phone, and routes

- The worker URL verifier passed the live root in 803 ms with `lang=en`, the
  correct title, one H1, one main landmark, complete image/control names, and
  no console errors.
- Axe found zero serious or critical issues on `/`, `/demo/`, `/privacy/`,
  `/terms/`, and the designed 404 route. The full suite checks both viewports;
  the independent live demo was also scanned on desktop and phone.
- The skip link was the first keyboard stop, showed a 3px cyan focus ring, and
  moved focus to `main`. The full suite also proved pointer hits, keyboard
  focus, and visible focus for every source trace.
- At 200% root text size, the 390px page remained 390px wide. Reduced motion
  changed transitions to `0s` and scroll behavior to `auto`.
- Route titles are specific: the product root, Demo, Privacy, Terms, and Page
  not found each use their own title. Internal links returned 200; `mailto:`
  is explicit.
- The unknown route deliberately returned HTTP 404 with one H1, one main, the
  common navigation/footer, and a route home. Its browser network message is
  the expected result of a real 404, not a defect.

## Privacy, offline use, security, and performance

- Fresh live landing, demo, export, restore, import, and actual OCR traffic
  sent no request outside the product origin. Billing was contacted only by
  explicit checkout or verification actions. No analytics, tracker, remote
  font, runtime CDN, upload, or telemetry request appeared.
- The service worker controlled a fresh phone profile. `registration.update()`
  completed with an active worker. The populated demo then reloaded offline
  with its H1, sample label, and offline notice intact.
- Root responses include CSP, HSTS, `nosniff`, frame denial, strict referrer,
  and restrictive permissions policies. Hashed assets use one-year immutable
  caching. HTML, manifest, and worker responses revalidate.
- The manifest, 192/512 and maskable icons, versioned start URL, metadata,
  social image, robots file, and four-route sitemap pass repository and live
  checks.
- Fresh live mobile Lighthouse: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.20 s, LCP 1.65 s, TBT 0 ms, CLS 0.00013,
  transfer 143,273 bytes.
- Initial authored JavaScript is 51,340 bytes plus a 5,714-byte Workbox helper.
  CSS is 20,948 bytes, fonts total 60,896 bytes, and the mobile hero AVIF is
  37,063 bytes. All static/PWA budgets pass.

This is a static, local-first PWA with no product backend, tenant, account,
health endpoint, server database, or restart-persistence boundary. Backend
tenant, health, restart, concurrency, and 429 checks therefore do not apply.
The external Sociobot billing service is not this product's backend.

## Live build identity

| File | SHA-256 | Result |
| --- | --- | --- |
| `index.html` | `82ba02ec0a61e38f0a7ef3545f30bc338e6739147d9adb0875e0e140ce688c84` | MATCH |
| `manifest.webmanifest` | `9d3e65c26eadff7b20b8a2bd16766002ca0c2546b46e1114d18c2679ed63e415` | MATCH |
| `sw.js` | `00d468f68a9e1e210a484aa0e21098f4f2c59f5b9051d4049de563e0cb9801ce` | MATCH |
| `assets/main-Mi_6xeKA.js` | `cbb15694162fc2d7e905d8b8e324312b0f85fe0a41f658676eb94c9d55b497e1` | MATCH |
| `assets/main-A5TKAGhl.css` | `e2de76524b962610f2000316b090a8168a1606019eeb8d45f7a430c5324ce783` | MATCH |

## Earlier finding disposition

| Earlier review | Current disposition and independent proof |
| --- | --- |
| Verification 1: missing claims/demo; weak audience; missing CSP, caching, metadata, and real 404 | CLOSED — 18 claims pass; the one-click isolated sample and complete first read are live; policies, metadata, caching, and HTTP 404 pass. |
| Verification 2: incomplete paid/free claims, undersized targets, stale import alert | CLOSED — page-six/SSML and free-limit tests pass; no demo control is below 44px; valid retry clears the alert. |
| Verification 3: unlisted capabilities and flaky full suite | CLOSED — public capabilities map to the 18 tests; the full clean suite passed 49/11 with no failure. |
| Verification 4: narrow privacy/offline/trace coverage; seven small controls; brand label mismatch; 200% overflow; handled console error | CLOSED — real OCR network/offline tests and all five traces pass; touch sizes, experimental label checks, reflow, and console checks pass. |
| Verification 5: live CSP backup failure; five trace-name failures; missing confidence/deletion claims; dead How it works links | CLOSED — live invalid-then-valid restore succeeds under CSP; label-in-name passes; both claims pass; secondary links point to `/#how`. |
| Verification 6: desktop first screen below fold; covered trace controls/focus; missing daily/revocation claims | CLOSED — all required first-read blocks fit at 1280 × 720; all trace pointer/focus checks pass; both entitlement claims pass. |
| Verification 7: no findings | CONFIRMED — its functional, accessibility, privacy, offline, and build results reproduce on this candidate. |
| Strict review 1: untestable “Desktop-quality unlock”; metaphor headings; incomplete copy audit | CLOSED — the phrase and metaphors are absent; the complete audit and rendered-route regression pass. |

## Findings

None. Critical 0, High 0, Medium 0, Low 0. Untested claims 0.

## Final decision

**PASS.** The candidate has zero findings of every severity and zero untested
public claims.
