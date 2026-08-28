# Independent verification 2 — FAIL

**Candidate:** `a37e1f757a192a0ebd2aa9a4f1199ca16687e0ee`  
**Live URL:** https://scan-reading-pack.sociobot.in  
**Verified:** 2026-08-28, from a clean `npm ci`; no product-source edits made.

## Release decision

**FAIL.** The repaired candidate is functional and the live site matches its
production output, but it still fails the factory acceptance contract:

1. The required claims manifest does not cover all visitor-facing claims, and
   its `$19 USD is a one-time unlock for unlimited-page OCR and SSML export`
   test only checks displayed copy and the checkout URL. It does **not** prove
   either unlimited-page OCR or SSML export. The README and terms also claim
   that the free edition recognizes *five pages per project*, but no claim
   entry/test covers that limit. The claims contract explicitly makes an
   unlisted claim a failed review finding.
2. The live 390px interface has interactive targets below the required 44 ×
   44 CSS px baseline: the compact header brand is 38 × 38 px, and footer
   Privacy and Terms links measure 43 × 17 px and 39 × 17 px. This contradicts
   both the non-negotiable accessibility baseline and the product's design
   thesis.

## First-read test — PASS

A cold desktop visit to `/` gives the answer in one screen:

- **What:** “Make reading packs from scanned pages.”
- **For whom:** “For readers with scanned books or reports who need selectable
  text linked to its source page.”
- **First action:** the visible primary link **“Try it with sample data”**,
  with the adjacent explanation “Opens a marked one-page reading pack.”

The three plain facts are also visible: sample data has its own workspace,
pages stay in the browser, and the pack works offline after the first visit.
The action opens `/demo/` directly, so this gate passes.

## Required claims gate

`.factory/claims.json` exists and every declared command was run individually
from this fresh install. All passed; outputs exercised Chromium desktop and
390px mobile except the deliberately Chromium-only real-OCR smoke test.

| Claim | Exact command | Result / observable evidence |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | PASS — sample pack, reset control, `demo:scan-reading-pack` database |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS — demo reloads offline after SW control |
| `source-trace` | `npm run test:e2e -- --grep @claim:source-trace` | PASS — line 2 selects and shows `.source-highlight` |
| `pack-export` | `npm run test:e2e -- --grep @claim:pack-export` | PASS — ZIP contains reading files, source map, source page |
| `browser-private` | `npm run test:e2e -- --grep @claim:browser-private` | PASS — only local preview origin during sample flow |
| `scan-import` | `npm run test:e2e -- --grep @claim:scan-import` | PASS — sample scan persists after reload |
| `local-ocr` | `npm run test:e2e -- --grep @claim:local-ocr` | PASS — actual Tesseract OCR returns the supplied scan text |
| `one-time-unlock` | `npm run test:e2e -- --grep @claim:one-time-unlock` | Command PASS, but **claim evidence insufficient**: it asserts price/copy and checkout destination only, not the stated unlimited OCR or SSML behavior. |

Final full-suite Playwright status is recorded in
`test-results/.last-run.json` (`passed`; no failed tests). The evidence above
does not cure the unlisted/incompletely tested claims finding.

## Clean checkout and product-flow evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Install | PASS | `npm ci`: 403 packages; audit reported 0 vulnerabilities. |
| Unit/integration | PASS | `npm test`: 7/7 Vitest tests. |
| Type/lint | PASS | `npm run lint` (`tsc --noEmit`). |
| Exact production build | PASS | `npm run build` produced `dist/`; PWA precache: 22 entries. |
| Full browser suite | PASS | `npm run test:e2e`: 20/20, desktop plus exact 390px project. |
| Normal flow | PASS | Imported `tests/fixtures/sample-scan.png`, performed real local OCR, edited/selected traced text, cropped a figure, persisted data, and downloaded the ZIP in the test flow. |
| Boundary/recovery | PARTIAL PASS | An 81 MiB image gives the explicit 80 MiB error, then a valid PNG imports successfully. The old error alert remains visible after the successful retry (medium defect below). |
| Demo isolation | PASS | `/demo/` uses `demo:scan-reading-pack`; a personal import uses `scan-reading-pack`. The demo banner, Reset demo, and Start for real controls appeared. |
| PWA offline | PASS | Fresh live 390px context waited for `navigator.serviceWorker.ready`, became controlled, went offline, and reloaded the demo with its sample, banner, and “You’re offline” notice intact. |
| SW update mechanism | PASS by implementation inspection | The live generated SW accepts `SKIP_WAITING` and uses `clientsClaim`; the app registers `onNeedRefresh` and offers an “Update now” action. A two-version production deployment was not available to force the prompt. |
| Privacy/network | PASS for tested flows | Cold/demo/personal-import traffic used only `https://scan-reading-pack.sociobot.in`; no tracker, remote font, or runtime CDN was seen. License verification is deliberately limited to the Sociobot API when chosen. |
| Live identity | PASS | Live `index.html` SHA-256 equals local `dist/index.html`: `e4fff52a242403f25ed85159bcb158b7c8f9d09e61ae2e27c6d7af9f2c7a6d92`. The deployed main JS and CSS hashes also equal this build. |
| Response/security policy | PASS | Live root/demo returned CSP, `nosniff`, frame/referrer/permissions policies and HSTS. Hashed main JS has `Cache-Control: public, max-age=31536000, immutable`; unknown route returned the designed HTTP 404. |
| Rate limiting | PASS | Sequential invalid-license verify requests 1–30 returned 200; request 31 returned `429` with `Retry-After: 3`. |

## Accessibility, responsive, and performance evidence

- `VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh
  https://scan-reading-pack.sociobot.in /tmp/srp-verify-url` passed: title,
  `lang=en`, one H1, main landmark, complete image alt text, no page-console
  errors.
- Fresh Axe scans of `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed
  404 at desktop and 390px found **0 serious or critical** findings. There was
  no horizontal overflow, and no product console/page errors (the browser
  correctly logs the direct 404 navigation's HTTP status).
- Keyboard check passed for the skip link (cyan, visible 3px outline), focus
  transfer to main, and Enter activation of a demo trace control. Reduced
  motion yielded a `0s` transition duration.
- The separate 44px measurement is a failure: brand 38 × 38; footer Privacy
  43 × 17; footer Terms 39 × 17 at 390px.
- Fresh live mobile Lighthouse evidence at `/tmp/srp-lighthouse.json`:
  Performance **98**, Accessibility **100**, LCP **1502 ms**, CLS
  **0.00013**, transfer **142,852 bytes**. Built authored main JS is 50.87 kB
  (19.66 kB gzip); authored CSS is 19.64 kB (5.16 kB gzip), within budget.

## Defects

### Critical — release blocking

1. **Claims contract is incomplete and the unlock claim is not behaviorally
   tested.** The `$19` claim promises unlimited-page OCR and SSML export, but
   `@claim:one-time-unlock` verifies only text and an href. The free five-page
   restriction is public in README/terms without any claims entry. Add a
   sandbox-observable entitlement test (or remove/qualify unsupported copy),
   and add a claim/test for the free limit before release.

### High — release blocking accessibility baseline

1. **Touch targets below 44px.** At 390px, the header brand and footer legal
   links are smaller than the specified minimum. Expand their actual clickable
   boxes (not merely adjacent visual spacing) and remeasure on mobile.

### Medium

1. **Stale invalid-import alert survives successful recovery.** Importing an
   81 MiB file correctly reports the size limit. Importing a valid scan next
   opens the workbench, but retains that old error banner until the user
   dismisses it. Clear or replace stale errors when a later action succeeds.

## Handoff recommendation

Do not release this candidate until the critical claims gap and high touch
target baseline failure are repaired and independently reverified. The prior
deployment-only concern is resolved: fresh live HTML/asset parity proves that
this candidate is deployed; the remaining failures are product-contract
issues, not a stale deployment.
