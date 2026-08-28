# Independent verification 3 — FAIL

**Candidate:** `7eae6354bda8754f57a06d6e5d412a22cdfaf0bd`  
**Live URL:** https://scan-reading-pack.sociobot.in  
**Verified:** 2026-08-28 from a clean checkout; no product-source files were changed.

## Decision

**FAIL — do not release.** The deployed site is this candidate and the core
flow is substantially functional, but two release-blocking contract failures
remain:

1. **Critical: visitor-facing claims are not all registered and sandbox-tested.**
   `README.md` promises review tools, figure crops, and project backup, while
   the landing page promises PDF/PNG/JPEG/WebP import, figure extraction,
   low-confidence review behaviour, and the listed export formats. There is no
   matching entry for several of these in `.factory/claims.json` (in particular
   figure crop, project backup/restore, file-type support, and correction
   queue). Untagged regression coverage does not meet the claims contract,
   which requires one exact `@claim:` test per public claim. The contract says
   unlisted claims fail review until they are tested or removed.
2. **High: the default browser quality gate was not reliable.** A clean
   `npm run test:e2e` run failed two mobile executions. The paid-unlock claim
   path, after a recorded valid license verdict, ended with “Page 6 could not
   be recognized. Check available storage and try again.” instead of beginning
   local recognition. The 390px touch-target regression also failed in that
   full run. Re-running each test in isolation passed, so this is an
   intermittent parallel/full-suite failure, not evidence that the failed run
   can be ignored. The definition of done requires the available test command
   to pass locally.

## First-read test — PASS

A cold live visit answers all three questions on the first screen:

- **What:** “Make reading packs from scanned pages.”
- **For whom:** readers with scanned books or reports needing selectable text
  linked to its source page.
- **First click:** **“Try it with sample data”**, explicitly described as
  opening a marked one-page reading pack.

It also states the demo workspace, browser-only handling, and offline-after-
first-visit facts. The link opens `/demo/` in one click.

## Required claims gate

`.factory/claims.json` exists. From the clean install, every command listed in
it was run through the demo entry point; all passed when run individually:

| Claim | Result / observable outcome |
| --- | --- |
| `demo-sandbox` | PASS — preloaded sample, reset control, and `demo:scan-reading-pack` IndexedDB namespace. |
| `offline-reload` | PASS — controlled demo service worker reloaded the sample offline. |
| `source-trace` | PASS — selecting the sample line displayed its source highlight. |
| `pack-export` | PASS — ZIP contained reading text/HTML/Markdown, source map, and source page. |
| `browser-private` | PASS — sample import flow used only the local preview origin. |
| `scan-import` | PASS — fixture scan imported and survived reload. |
| `local-ocr` | PASS — real local OCR returned text from the shipped scan. |
| `five-page-free-limit` | PASS — page six showed the free-tier limit. |
| `one-time-unlock` | PASS in isolation — a recorded valid verdict enabled page-six OCR and SSML in the downloaded ZIP. |

This does not cure the unlisted-claims failure or the failed default full-suite
run noted above.

## Clean checkout and product evidence

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 403 packages installed; audit reported 0 vulnerabilities. |
| `npm test` | PASS | 7/7 Vitest tests. |
| `npm run lint` | PASS | `tsc --noEmit`. |
| `npm run build` | PASS | Produced `dist/`; PWA precache has 22 entries. |
| `npm run test:e2e` | **FAIL** | Full run failed mobile paid-unlock and mobile touch-target executions; isolated reruns passed, demonstrating flakiness. |
| Image scan import | PASS | Shipped PNG imported, persisted, was cropped, and completed actual browser OCR in the claim suite. |
| Image-only PDF import | PASS | A fresh PDF generated from the shipped scan imported locally, opened as Page 1, and exposed “Recognize this page”; no console/page errors. |
| Invalid/recovery path | PASS in test coverage | 80 MiB-plus image gives the stated size error, then a valid image clears it and imports. |
| Live deployment identity | PASS | Local/live SHA-256 matched: index `01974563b72e765b6490c1c62a979224615c21c4b5b642d1005ce0b9be6acdab`; main JS `d3297e7212d4864a1e676fbf0d2add4e8a02ff451c262923e596d6a05301c2c8`; CSS `f03b3087a561245b45d999f60bfe625ee26d48acde6bc8d7cdfbca567e22cbe4`. |

## Live PWA, privacy, accessibility, and policy

- `/opt/fleet/lib/verify-url.sh` passed against the live root: title,
  `lang=en`, one H1, main landmark, image alt text, and no page-console errors.
- Fresh desktop and 390px Axe scans of `/`, `/demo/`, `/privacy/`, `/terms/`,
  and the HTTP-404 route found **0 serious or critical** issues. Both viewports
  had no horizontal overflow. The intentional 404 navigation was the sole
  browser console error observed.
- Keyboard: Tab reached the skip link with a visible `3px` cyan outline;
  the demo trace activated and showed its source region. Reduced motion made
  primary-control transition duration `0s`.
- At 390px, live measurements for brand, Privacy, and Terms were each at least
  44 × 44 CSS px. Demo banner/reset/start controls were visible.
- PWA: after a fresh visit, the live demo was service-worker controlled;
  setting the browser offline and reloading retained the sample and displayed
  “You’re offline.” The generated worker has `clientsClaim`; application code
  registers an update prompt and sends `SKIP_WAITING`. A second deployed
  version was unavailable to force an update toast.
- Privacy/network: cold load and demo interactions made requests only to
  `https://scan-reading-pack.sociobot.in`; no third-party font, tracker, or
  runtime CDN was observed. Source data uses IndexedDB. License verification
  is the only implemented optional outbound path and targets Sociobot.
- Headers: root/demo/privacy/terms returned CSP, HSTS, `nosniff`, strict-origin
  referrer policy, frame denial, and permissions policy. The unknown route was
  a real HTTP 404. Hashed main JS was `Cache-Control: public, max-age=31536000,
  immutable`.
- Budget: authored main JS is 50.88 kB (19.66 kB gzip), shared source chunk
  7.88 kB gzip, Workbox 2.25 kB gzip, and CSS 5.17 kB gzip—within the static
  initial-JS/CSS budgets. Lighthouse could not be completed in this container;
  the bundle measurements and live browser checks are recorded instead.
- Rate limiting: 40 rapid invalid requests to
  `https://api.sociobot.in/api/v1/products/scan-reading-pack/verify` returned
  200 for requests 1–30 and **429 with `Retry-After: 2`** for request 31 onward.

## Required repair and re-verification

1. Register every public capability claim in `.factory/claims.json` and add a
   one-to-one observable demo test, or remove/qualify the copy. Include figure
   crop/export, project backup/restore, stated import types, and the correction
   queue at minimum.
2. Make `npm run test:e2e` deterministic under its default two-worker
   configuration. Diagnose the mobile page-six OCR failure (and confirm the
   mobile target regression) rather than relying on isolated reruns.
3. Re-run the entire clean verification, including all listed claim commands,
   before changing this decision to PASS.
