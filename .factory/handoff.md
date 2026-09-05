# Scan Reading Pack — repair 7 handoff

## Release status: DEPLOYED

Repair 7 closes both findings and the untested-copy claim in strict review 1.
The deployed implementation is commit
`f6e785b7ca64fa9d28a4e18a97c8636e9ae1c1f3`. Documentation and verification
evidence follow that implementation commit in Git history.

## What changed

- Removed the unmeasurable “Desktop-quality unlock” claim. The public offer now
  says exactly what its existing claim test proves: a $19 USD one-time license
  adds unlimited-page OCR and SSML export.
- Replaced metaphorical and mood headings across the landing, demo, legal, 404,
  empty, and update states with literal task names. Examples now include “Local
  scan-to-text tool,” “Make a reading pack in four steps,” “Paid license,” and
  “We could not find this page.”
- Expanded `.factory/copy-audit.md` from seven rows to every string in all
  personal and demo landing states. It covers headings, controls, body copy,
  empty states, status and recovery copy, paid states, and footer text. Every
  sentence is at most 22 words and the terminology table is complete.
- Added a browser regression that checks rendered public routes for banned
  marketing terms and the rejected metaphors. It checks user-visible output
  instead of matching implementation source strings.
- Extended the 44px target regression to desktop and phone. Header navigation
  now has at least a 44×44px target without exposing hidden phone navigation.
- Updated `fflate` from 0.8.2 to 0.8.3. A clean install now reports zero npm
  vulnerabilities.
- Advanced the installed-app start URL to `?v=4` and the public build label to
  1.0.4 so installed clients detect the new service worker.
- Added the verb-first catalog description and copied the identical 88-byte
  file to `/work/.evidence/catalog-description.txt`.
- Wrote the actual $19 USD one-time offer metadata to
  `/work/.evidence/billing-offer.json`. No credential is present.

## Earlier finding disposition

| Review | Disposition and current proof |
| --- | --- |
| Verification 1: no claims/demo, weak first screen, missing policy/metadata/404 | Closed. The isolated one-click sample, 18 exact claims, full first screen, headers, metadata, caching, and designed 404 all pass. |
| Verification 2: incomplete paid behavior, small targets, stale import error | Closed. Page-six OCR and SSML are exercised; all demo controls are at least 44×44px; valid import clears the error. |
| Verification 3: unlisted capabilities and flaky full suite | Closed. Every claim command passed separately and the final full suite passed 49 with 11 documented skips. |
| Verification 4: narrow privacy/offline/trace coverage, label mismatch, 200% overflow, handled console error | Closed. Real OCR privacy/offline paths, every sample trace, label-in-name, 200% reflow, and clean consoles pass. |
| Verification 5: live backup restore blocked by CSP, trace names, confidence/deletion claims, dead links | Closed. Restore recovery, accessible trace names, declared confidence/deletion claims, and cross-route links pass. |
| Verification 6: desktop first-read overflow, covered trace controls, missing entitlement claims | Closed. First-read bounds fit, all five traces accept pointer/keyboard input, and daily/revocation claims pass. |
| Verification 7: no defects | Confirmed. Its functional results reproduce on the repair 7 build. |
| Strict review 1: untested desktop-quality claim and metaphor headings/incomplete audit | Closed. The claim was removed, all public headings are literal, and the complete landing-copy audit plus rendered-route regression pass. |

## Clean local verification

Run from `/work/repo` on 5 September 2026:

```bash
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

- `npm ci`: 403 packages installed; 0 vulnerabilities.
- `npm test`: 13/13 Vitest tests passed.
- `npm run lint`: TypeScript `--noEmit` passed.
- `npm run build`: passed and produced `dist/index.html`; the PWA precache has
  22 entries totaling 625.68 KiB.
- Every exact command in all 18 `.factory/claims.json` entries passed
  separately on the final build. OCR/entitlement matrices intentionally skip
  only duplicate phone executions.
- `npm run test:e2e`: 49 passed, 11 documented cross-project skips, 0 failed.
- The required local `verify-url.sh` check passed in 602ms with the correct
  title and language, one H1/main, complete alt/control names, and no console
  errors.
- Playwright Axe found zero serious or critical issues on `/`, `/demo/`,
  `/privacy/`, `/terms/`, and the real 404 route. Keyboard focus is a visible
  3px ring. Reduced motion gives `0s` transitions and automatic scrolling.
- Local Lighthouse mobile: Performance 97, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.7s, LCP 2.4s, TBT 0ms, CLS 0, 195 KiB transfer.
- Initial authored JavaScript is 51,340 bytes plus 5,714 bytes of Workbox
  (21,886 bytes gzip combined). CSS is 20,948 bytes / 5,380 bytes gzip. Fonts
  total 60,896 bytes. The mobile hero AVIF is 37,063 bytes.

## Live verification

- The final build was deployed to the existing one-replica-equivalent Azure
  Static Web App `sf-scan-reading-pack` and is live at
  `https://scan-reading-pack.sociobot.in`. No backend, database, volume, DNS,
  billing setting, or unrelated resource was changed.
- Fresh 1280×720 and 390×844 browsers showed the job, audience, sample action,
  action result, and all three facts before scrolling. The last fact ended at
  y=632 on desktop and y=688 on phone. Neither viewport overflowed sideways.
- In both fresh browsers, all five sample lines showed their source regions. A
  correction appeared in the exported ZIP and source map. Reset restored the
  original sample, and the demo label stayed visible throughout.
- The demo database existed only while the sample was open. Personal project
  counts remained 0 before, during, and after the flow. Leaving the demo
  deleted its database. Every visible demo control measured at least 44×44px.
- All observed landing/demo requests were same-origin. Both fresh browser
  consoles stayed clean.
- The service worker controlled the page, completed an update check, and
  reloaded the populated sample offline with the offline notice.
- Privacy, Terms, and Demo returned 200 with route-specific titles. The
  deliberate unknown route returned HTTP 404 with one H1/main and a route
  home. Axe found zero serious or critical issues on every route.
- The live plain-word policy check passed every route. No banned marketing
  term or rejected workshop, workbench, bench, shelf, chapter, or
  desktop-quality label is rendered.
- The worker URL verifier passed in 891ms with no console errors. Live
  Lighthouse mobile scored 100 for Performance, Accessibility, Best Practices,
  and SEO; FCP 1.2s, LCP 1.5s, TBT 0ms, CLS 0, 140 KiB transfer.
- Security headers include CSP, HSTS, `nosniff`, frame denial, strict referrer,
  and restrictive permissions policies. Hashed assets use one-year immutable
  caching. The checkout endpoint returns the expected hosted-checkout redirect.
  No paid transaction was made; valid and revoked entitlements are proven with
  recorded responses in the claim tests.

Local and live SHA-256 hashes match:

| File | SHA-256 |
| --- | --- |
| `index.html` | `82ba02ec0a61e38f0a7ef3545f30bc338e6739147d9adb0875e0e140ce688c84` |
| `manifest.webmanifest` | `9d3e65c26eadff7b20b8a2bd16766002ca0c2546b46e1114d18c2679ed63e415` |
| `sw.js` | `00d468f68a9e1e210a484aa0e21098f4f2c59f5b9051d4049de563e0cb9801ce` |
| `assets/main-Mi_6xeKA.js` | `cbb15694162fc2d7e905d8b8e324312b0f85fe0a41f658676eb94c9d55b497e1` |
| `assets/main-A5TKAGhl.css` | `e2de76524b962610f2000316b090a8168a1606019eeb8d45f7a430c5324ce783` |

Evidence is in `.factory/qa-artifacts/repair-7/`.

## Known gaps

No product defect remains from the current or earlier reviews. A real paid
purchase was deliberately not made; the registered checkout is live, while
license activation and revocation use deterministic recorded gateway responses
in tests. Independent factory re-verification is still required.
