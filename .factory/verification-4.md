# Independent verification 4 — FAIL

**Candidate:** `4402b065e3c6102e8a05d956040130bb3eee5227`

**Live URL:** https://scan-reading-pack.sociobot.in

**Verified:** 2026-08-28 from a clean checkout; product code was not changed.

## Decision

**FAIL — do not release.** The repaired test suite is stable, every listed
claim command passes, the deployed files exactly match this candidate, and the
core reading-pack flow works. Fresh independent checks nevertheless found four
release-blocking acceptance failures:

1. **High — public privacy/offline claims are not fully represented and proved
   by exact claim tests.** The landing page says later OCR can stay offline;
   Privacy and README say source files and extracted text are never uploaded,
   and that the app has no analytics, trackers, remote fonts, or runtime CDN
   scripts. `@claim:offline-reload` only reloads the pre-seeded demo shell
   offline. `@claim:browser-private` imports a scan but never runs OCR and only
   checks request origins, which cannot disprove same-origin telemetry. The
   narrower registered claims do not cover the broader public promises. Also,
   `source-trace` promises **every** sample line can show its region, while its
   exact test checks only line 2. Manual verification found local offline OCR
   and same-origin demo traffic working, but the claims contract requires the
   public promise itself to have an exact sandbox regression; manual success
   does not cure the missing coverage.
2. **High — seven mobile controls miss the mandatory 44×44 CSS-pixel touch
   target.** At exactly 390×844, **Reset demo** and **Start for real** measured
   159×40 and 177×40. The five `P1 · L1` through `P1 · L5` source-trace buttons
   each measured 49×25. These are core demo and trace actions, not incidental
   links. The existing regression checks only the brand and footer links.
3. **High — the brand fails the serious accessible label-in-name audit at
   desktop and mobile sizes.** An explicit Axe experimental-rule run and
   Lighthouse both identified `a.brand` as
   `label-content-name-mismatch` with serious impact: visible text includes
   “SR”, while `aria-label="Scan Reading Pack home"` does not include it.
   This fails the required name/role/state and serious-Axe baseline even though
   the non-experimental default Axe rules report no serious/critical findings.
4. **High — the landing page does not reflow at 200% text size.** At a 390px
   viewport, setting root text to 200% produced a 454px document width, a 64px
   horizontal overflow. The pricing/license panel and its controls extended to
   x=454, requiring horizontal panning and violating the explicit 200%-text
   acceptance rule.

One low-severity issue was also observed: a handled unsupported-file import
shows the correct recoverable alert but writes an `Error: Unsupported image`
stack to the browser console. Normal loads and normal flows had no console or
page errors.

## First-read gate — PASS

A cold live visit answers all three required questions on the first screen:

- **What it does:** “Make reading packs from scanned pages.”
- **For whom:** readers with scanned books or reports who need selectable text
  linked to its source page.
- **What to click first:** **Try it with sample data**, described beside the
  action as opening a marked one-page reading pack.

The action opens `/demo/` in one click. Its first rendered screen is a populated
sample workbench with the persistent “Demo — sample data, nothing is saved”
banner, **Reset demo**, and **Start for real**.

## Required claims gate

`.factory/claims.json` exists and contains 13 entries. After `npm ci`, every
recorded command was run separately and returned zero:

| Claim | Result and observed assertion |
| --- | --- |
| `demo-sandbox` | PASS — populated sample, reset, and isolated demo database. |
| `offline-reload` | PASS — sample reloads under browser offline mode. |
| `source-trace` | PASS as written — line 2 shows a source highlight; it does not exercise the promised “every line.” |
| `pack-export` | PASS — ZIP has reading files, source page, and source-map entry. |
| `browser-private` | PASS as written — tested demo import requests stay on the preview origin; no license key is added. |
| `scan-import` | PASS — fixture imports and survives reload. |
| `scan-file-types` | PASS — PDF, PNG, JPEG, and WebP import on desktop. |
| `figure-crop` | PASS — crop is saved as WebP in the project backup. |
| `correction-queue` | PASS — low-confidence correction persists after reload. |
| `project-backup` | PASS — backup contents validate and restore. |
| `local-ocr` | PASS — real browser OCR reads “THE NIGHT READING ROOM.” |
| `five-page-free-limit` | PASS — page six is stopped with the stated limit. |
| `one-time-unlock` | PASS — $19 Sociobot destination, recorded valid verdict, page-six OCR start, and SSML. |

The clean clone initially had no installed executables, so literal pre-install
invocations exited at `tsc: not found`. Those setup attempts were not treated
as product results. `npm ci` was then run, and all exact claim commands above
were rerun successfully in the required clean-install state.

Each claim tag occurs exactly once in `tests/e2e/app.spec.ts`. Three expensive
matrices intentionally skip the 390px project (`scan-file-types`, `local-ocr`,
and `one-time-unlock`); their shared import/workbench surfaces are otherwise
covered at 390px.

## Clean build and automated gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 403 packages; audit found 0 vulnerabilities. |
| `npm test` | PASS — 7/7 Vitest tests in 2 files. |
| `npm run lint` | PASS — `tsc --noEmit`; no separate linter exists. |
| `npm run build` | PASS — exact production build produced `dist/`; PWA precache has 22 entries (624.14 KiB). |
| `npm run test:e2e` | PASS — 29 passed, 5 intentional skips, 0 failed in the default two-worker desktop/390px run. |

The full browser gate is now reproducible and includes the previously flaky
desktop-only OCR/unlock path. It covers normal image import, all advertised
formats, real OCR, correction persistence, source trace, figure crop, free and
paid boundaries, ZIP contents, project backup/restore, invalid 80 MiB input and
recovery, accessibility, responsive overflow, and offline reload.

Independent invalid-input checks also passed: an unsupported text file showed
the actionable file-type alert, a subsequent valid PNG cleared the alert and
opened normally, and an invalid backup showed the expected backup error.

## Live deployment identity

The live artifact is this candidate. SHA-256 hashes matched local `dist/`
exactly:

| File | SHA-256 |
| --- | --- |
| `index.html` | `bc9afadda456a7cfd18d83290bf5d3c8dc91b7f72bc794ef879eb1fadd5e9981` |
| `assets/main-Bal-8QSn.js` | `ea62dcb09abc4fae15c0303e6df5c30428799ba1ba887c4d0931f48b3261888a` |
| `assets/main-yNjEcAUN.css` | `e4ef1790fc0b7dc610d310710275087ffcacd1c8fed060756307df03dd8d0c48` |
| `sw.js` | `4812ab2c442e21ffa3fb083f2a86b85b30e1bff512a80d790ff56b5e8ebccea5` |

The worker verifier passed the live root: HTTP 200, title, `lang=en`, one H1,
main landmark, complete image alt text, and no console errors. Measured load in
that run was 871 ms.

## Hands-on product flow and storage boundaries

- The authored sample immediately exposes text, confidence, source page, and
  page-region trace. Export produces Markdown, plain text, HTML, source map,
  source image, and figures; a valid recorded license adds SSML.
- Real local OCR read the supplied scan online. After the English OCR assets
  were cached, a second freshly imported scan was recognized successfully with
  the browser offline, again returning “THE NIGHT READING ROOM,” with no
  console errors.
- A personal IndexedDB project was seeded before entering the demo. `/demo/`
  did not display it and used `demo:scan-reading-pack`; **Start for real**
  deleted the demo database and restored the separate `scan-reading-pack`
  library. This independently confirms the sandbox boundary.
- The product warns about rights, avoids perfect-transcription claims, keeps
  page coordinates, supports review/corrections, and provides source-page
  jumps and project ownership exports as the brief requires.

## Accessibility and responsive checks

- Desktop and 390px checks of `/`, `/demo/`, `/privacy/`, `/terms/`, and the
  designed HTTP-404 page found one H1, one main landmark, valid language/title,
  complete image alt text, and no horizontal overflow at normal text size.
- Playwright Axe found 0 default serious/critical violations on those routes.
  An explicit `label-content-name-mismatch` Axe run reproduced one serious
  brand violation on both desktop and mobile; Lighthouse found the same issue.
- Keyboard-only use reaches the skip link first. It has a visible 3px cyan
  focus outline; Enter moves focus to `main`. The source-trace action works
  with Enter, and no keyboard trap was found.
- With `prefers-reduced-motion: reduce`, the media query matched, animations
  were absent, smooth scrolling became `auto`, and control transition duration
  was `0s`.
- Normal 390px layout has no horizontal overflow and the workbench is usable,
  but the seven undersized targets and 200% text reflow failures block release.

## Privacy, network, policies, and billing

- Cold landing and demo interactions made requests only to
  `https://scan-reading-pack.sociobot.in`; no trackers, third-party fonts, or
  runtime CDNs were observed. The broader public privacy claims still need the
  exact OCR-path claim regression described in the decision.
- Root, demo, privacy, terms, and 404 responses include CSP, HSTS, `nosniff`,
  strict-origin referrer policy, frame denial, and restrictive permissions
  policy. The unknown route returns a real HTTP 404.
- HTML, manifest, and worker responses revalidate after 30 seconds. Hashed main
  JS is `public, max-age=31536000, immutable`.
- Chrome parsed the manifest with no errors and reported no installability
  errors. It includes 192/512 icons, a maskable icon, standalone display,
  themed colors, versioned start URL, scope, and app id.
- The buy link reaches the required Sociobot endpoint, which returned HTTP 303
  to the hosted Dodo checkout. The verifier preflight allows the product origin.
- Fresh rate-limit burst: verifier requests 1–30 returned 200; request 31 and
  requests 32–50 returned **429** with **`Retry-After: 4`**.
- The product has no sign-in and no application backend. Entra authority,
  backend persistence/concurrency/health, and library/CLI consumer tests are
  not applicable.

## PWA and performance

- A fresh visit registered and controlled `sw.js`. Explicit
  `registration.update()` completed with the worker activated. No second
  deployed version existed to force the visual update toast; source and built
  worker inspection confirm prompt registration and `SKIP_WAITING` handling.
- Offline reload retained the sample workbench and displayed “You’re offline.”
- Lighthouse mobile: **Performance 99, Accessibility 100, Best Practices 100,
  SEO 100**. The separate serious experimental label-in-name result remains a
  blocker despite the rounded category score.
- Lab metrics: FCP 1.2 s, LCP 1.6 s, TBT 100 ms, CLS 0, Speed Index 1.2 s.
- Initial live transfer: main JS 19.88 kB plus Workbox helper 2.31 kB; CSS
  5.43 kB; fonts total 61.16 kB; AVIF hero 37.16 kB. These are within the
  200/50/120/300 kB budgets. PDF/OCR code and data are deferred from landing.

## Required repair before re-verification

1. Give every visible interactive control a 44×44 minimum hit area, including
   both demo-banner actions and all trace buttons; extend the regression to
   audit all visible controls at 390px.
2. Make the brand's accessible name include its visible “SR” label, or make
   that monogram genuinely decorative without exposed text semantics.
3. Make the 390px landing/pricing layout reflow at 200% text without horizontal
   scrolling, and add a browser regression.
4. Register exact claim coverage for the broader no-upload/no-tracking and
   cached-offline-OCR promises, and exercise the actual OCR network path. Test
   every sample line for the `source-trace` “every line” quantifier, or narrow
   the public claim.
5. Stop logging handled invalid-import exceptions as console errors, or lower
   them to non-error diagnostics after the user-facing recovery state is set.
