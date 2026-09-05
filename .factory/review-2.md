# Review 2 — Make reading packs from scanned pages

**Verdict: PASS**

- Findings: **0** — Critical 0, High 0, Medium 0, Low 0
- Untested public claims: **0**
- Live URL: https://scan-reading-pack.sociobot.in
- Reviewed: 5 September 2026
- Implementation reviewed: `f6e785b7ca64fa9d28a4e18a97c8636e9ae1c1f3`
- Documentation reviewed: `866a838b9bf4646ce317ddac67eddc07454aa39d`

`866a838` changes only factory reports and evidence after `f6e785b`. A clean
production build at `866a838` therefore reviews the implementation at
`f6e785b`. The live HTML, manifest, service worker, main JavaScript, and main
CSS match that build byte for byte.

## First screen

Fresh, uncached browser contexts opened the live root before any scrolling.
Both the 1280 × 720 desktop and 390 × 844 phone showed:

- Job: **“Make reading packs from scanned pages.”**
- Audience: **“For readers with scanned books or reports who need selectable
  text linked to its source page.”**
- First action: **“Try it with sample data.”**
- Result: **“Opens a marked one-page reading pack.”**
- Facts: the sample has its own workspace, pages stay in this browser, and
  cached OCR works offline.

The last required fact ended at y=632 on desktop and y=688 on phone. Both
pages had no horizontal overflow. The skip link was the first keyboard stop
and moved focus to `main` on Enter. Neither fresh load had a console error.

## Demo and product paths

The first action opened `/demo/` in one click. The populated “Night Reading
Room” sample showed five lines, confidence states, source content, and the
persistent **“Demo — sample data, nothing is saved to your library”** label.

- All five source-line controls showed the matching source highlight.
- A sample correction was saved, then **Reset demo** restored its original
  line while the sample label remained present.
- The demo used `demo:scan-reading-pack`. Starting for real discarded it,
  opened the distinct personal database, and left that fresh personal library
  with zero projects.
- The checked normal, invalid, boundary, and recovery paths cover actual
  local OCR; PDF, PNG, JPEG, and WebP import; invalid backup then valid
  restore; oversized and unsupported import then valid retry; figure crop;
  correction persistence; source trace; backup restore; five-page free limit;
  valid entitlement for page six and SSML; and revoked entitlement recovery.

No account or remote product data was read or changed. The app is static and
local-first, with no product backend, tenant, health endpoint, shared database,
or restart-persistence boundary. Backend tenant, health, restart, and product
429 checks do not apply. Billing calls are made only for explicit purchase or
license verification; their recorded entitlement tests cover the public paid
behavior.

## Claims

The manifest has 18 claims. From a fresh clone after `npm ci`, every exact
command listed in `.factory/claims.json` was run separately. Each command
passed, and every `@claim:<id>` tag occurs exactly once in the suite.

| Claim | Result |
| --- | --- |
| demo-sandbox | PASS |
| offline-reload | PASS |
| source-trace | PASS |
| pack-export | PASS |
| browser-private | PASS |
| no-third-party-runtime | PASS |
| scan-import | PASS |
| scan-file-types | PASS |
| figure-crop | PASS |
| correction-queue | PASS |
| confidence-preservation | PASS |
| project-backup | PASS |
| local-deletion | PASS |
| local-ocr | PASS |
| five-page-free-limit | PASS |
| one-time-unlock | PASS |
| daily-license-check | PASS |
| refund-revocation | PASS |

The claims exercise observable sandbox outcomes, including local OCR after
language caching, output ZIP contents and coordinates, separate demo storage,
no upload/telemetry traffic, all announced formats, project restoration,
license timing and revocation. Landing, demo, README, privacy, and terms copy
were cross-checked against the manifest. There are no unlisted or untested
public claims.

## Clean checkout gates

Clean checkout: `/work/scan-reading-pack-review-2-clean` at documentation
commit `866a838b9bf4646ce317ddac67eddc07454aa39d`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 403 packages installed; 0 vulnerabilities |
| Every exact claim command | PASS — 18/18, individually |
| `npm test` | PASS — 13/13 |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/index.html`; 22-entry 625.68 KiB precache |
| `npm run test:e2e` | PASS — 49 passed, 11 intentional skips, 0 failed |

The intentional skips avoid duplicating resource-heavy OCR, file-format, and
entitlement matrices in the second viewport. Shared UI paths remain covered in
both desktop Chromium and the 390px phone project.

## Accessibility, privacy, routes, and PWA

- The required live URL verifier passed in 756 ms: correct title and language,
  one H1, one main landmark, complete image alt/control names, and no console
  errors.
- Live Playwright Axe found zero serious or critical findings on the root.
  The complete browser suite tests root, demo, privacy, terms, and 404 in both
  viewports with the same threshold. `@axe-core/cli` could not discover a
  Selenium Chrome binary in this worker; this is a CLI harness limitation, not
  a product result, and the required Playwright Axe alternative completed.
- Privacy and Terms returned 200 with their specific titles, one H1, and one
  main. The deliberate unknown route returned HTTP 404 with the designed page,
  one H1, one main, common navigation/footer, and a route home.
- A fresh live demo was controlled by an active service worker. After the
  first visit it reloaded offline with its sample H1, persistent demo banner,
  and offline notice. `registration.update()` completed.
- A live landing-to-demo request audit recorded 14 non-blob requests, all to
  `https://scan-reading-pack.sociobot.in`; no analytics, tracking pixel,
  remote font, runtime CDN, upload, or telemetry request occurred.
- Live root headers include CSP, HSTS, `nosniff`, frame denial, strict
  referrer policy, and restrictive permissions policy. The build remains
  within the verified static/PWA asset budgets.

## Live build identity

| File | SHA-256 | Result |
| --- | --- | --- |
| `index.html` | `82ba02ec0a61e38f0a7ef3545f30bc338e6739147d9adb0875e0e140ce688c84` | MATCH |
| `manifest.webmanifest` | `9d3e65c26eadff7b20b8a2bd16766002ca0c2546b46e1114d18c2679ed63e415` | MATCH |
| `sw.js` | `00d468f68a9e1e210a484aa0e21098f4f2c59f5b9051d4049de563e0cb9801ce` | MATCH |
| `assets/main-Mi_6xeKA.js` | `cbb15694162fc2d7e905d8b8e324312b0f85fe0a41f658676eb94c9d55b497e1` | MATCH |
| `assets/main-A5TKAGhl.css` | `e2de76524b962610f2000316b090a8168a1606019eeb8d45f7a430c5324ce783` | MATCH |

## Earlier finding disposition

| Earlier review | Current disposition |
| --- | --- |
| Verification 1 | CLOSED — claims, isolated one-click demo, audience-first screen, CSP/cache/metadata, and real 404 all pass. |
| Verification 2 | CLOSED — free/paid outcomes are sandbox-proved, all targets meet 44px, and valid import retry clears the error. |
| Verification 3 | CLOSED — all public capabilities map to 18 claims and the full suite passes reliably. |
| Verification 4 | CLOSED — real OCR privacy/offline and every trace are tested; control sizes, accessible names, reflow, and console state pass. |
| Verification 5 | CLOSED — backup recovery works under live CSP; confidence/deletion claims and How-it-works links are complete. |
| Verification 6 | CLOSED — first screen fits the desktop baseline; trace controls have independent pointer/focus paths; daily/revocation behavior is claimed and tested. |
| Verification 7 | CONFIRMED — its functional, security, PWA, accessibility, and privacy results reproduce. |
| Strict review 1 | CLOSED — untestable “Desktop-quality unlock” copy and metaphorical headings are absent; the complete copy audit and rendered-copy regression pass. |
| Verification 8 | CONFIRMED — its zero-finding result reproduces on the same implementation candidate. |

## Findings

None. Critical 0, High 0, Medium 0, Low 0. Untested public claims 0.

## Final decision

**PASS.** This review found zero findings of every severity and zero untested
public claims.
