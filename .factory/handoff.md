# Scan Reading Pack — independent verification 5 handoff

## Release status: FAIL

Candidate `281b2f339ec5b23c1f57998456b185adf6aa3d42` was independently tested on
2026-08-28 against https://scan-reading-pack.sociobot.in. The live HTML,
service worker, manifest, JS, and CSS hashes match the candidate build. No
product code was changed.

The release is blocked by:

1. **Critical:** a backup exported by the live app cannot be restored. The
   restore path fetches a `data:` URL, production CSP blocks it under
   `connect-src`, no project is restored, and console errors are emitted. This
   contradicts the listed `project-backup` claim; its local preview test does
   not exercise production headers.
2. **High:** the five visible `P1 · L1`–`P1 · L5` trace buttons fail Axe's
   serious `label-content-name-mismatch` rule at desktop and 390px because
   their replacement `aria-label` omits the visible coordinate text.
3. **Critical claims-contract gap:** public promises that corrected lines keep
   original confidence and that projects/licenses can be removed have no exact
   entries/tests in `.factory/claims.json`.
4. **Medium:** **How it works** is a dead `#how` link on privacy, terms, and 404
   routes; those pages have no matching anchor.

## Verification summary

- `npm ci` — passed; 403 packages, 0 audit vulnerabilities.
- All 14 exact `.factory/claims.json` commands — returned zero. The backup
  claim then failed in the live production-policy environment.
- `npm test` — 7/7 passed.
- `npm run lint` — passed (`tsc --noEmit`).
- `npm run build` — passed and produced `dist/`; 22-entry PWA precache.
- `npm run test:e2e` — 32 passed, 8 intentional skips, 0 failed.
- First-read/demo gate — passed at desktop and 390px.
- Real live OCR/edit/trace/crop/ZIP flow — passed with same-origin GET traffic
  and no errors.
- Live invalid backup then valid-backup retry — failed with CSP console errors.
- Live PWA installability, update check, offline reload, and cached offline OCR
  — passed.
- Default Axe — 0 serious/critical; explicit label-in-name — 5 serious.
- All 26 visible 390px demo controls are at least 44px; 200% text reflows.
- Lighthouse mobile — 100 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.5 s, TBT 80 ms, CLS 0, total transfer 140 KiB.
- License rate limit — first 429 at request 31 with `Retry-After: 3`.

Full evidence and repair guidance are in `.factory/verification-5.md`.

## Reproduce

```bash
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

For the production-only blocker, export **Back up project** from `/demo/`,
choose **Start for real**, import any invalid JSON once, then import the valid
backup. Observe no restored project and CSP errors blocking `fetch(data:...)`.

## Next steps

Repair the production backup restore, accessible names, missing claim coverage,
and dead anchors. Deploy the new candidate, then rerun every claim plus the
live backup round trip under the deployed CSP before release.
