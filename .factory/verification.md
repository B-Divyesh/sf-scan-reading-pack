# Independent verification — FAIL

**Candidate:** `1477079d1a425f237379feb1a23d3f1e47f25c7d`  
**Live URL:** https://scan-reading-pack.sociobot.in  
**Verified:** 2026-08-28 (fresh `npm ci`; no product-source changes)

## Release decision

**FAIL.** This is not a release candidate under the factory contract. The required
`.factory/claims.json` is absent, so no claimed behavior has the mandatory
sandbox test. The first live screen also has no one-click **“Try it with sample
data”** action. `/demo` and `/?demo=1` both return the ordinary empty landing
page; neither supplies sample data, the required persistent demo banner/reset
controls, nor an isolated `demo:` storage namespace.

## First-read test (cold live visit)

At `https://scan-reading-pack.sociobot.in/`, the title is *“Scan Reading Pack —
trustworthy text from scanned pages”* and the single H1 is *“Turn a scan into
text you can trace.”* The page explains converting scans into selectable,
audiobook-ready text with page coordinates and presents **Choose scans** first.
It does not plainly identify the intended reader on that first screen, and it
does not offer a sample-data trial. This fails the explicit plain-words and
demo-sandbox gate irrespective of the implementation quality behind the upload
button.

## Required claim gate

The very first command was the required clean-clone claim runner. It stopped
before any claim could run:

```text
RELEASE_BLOCKER: missing .factory/claims.json
```

Consequences:

- `offline-reload`, local/private processing, traceability, exports, and other
  visitor-facing statements have no required `@claim:<id>` demo-entry test.
- The landing page and README contain numerous claim-like statements, so all
  are unlisted claims until the manifest and matching tests exist.

## Test evidence

| Check | Result | Evidence |
|---|---|---|
| `npm ci` | PASS | 403 packages installed; 0 npm audit vulnerabilities |
| `npm test` | PASS | 4/4 Vitest tests |
| Type check and production build | PASS | `npm run build`; generated `dist/` and PWA precache |
| `npm run test:e2e` after the documented build prerequisite | PASS | 8/8 Playwright checks: desktop/mobile, image import, IndexedDB persistence, OCR, figure crop, export readiness, and offline reload |
| E2E from a clean install before building | BLOCKED | Preview server waits for absent `dist/` then times out at 60 s. README documents build before E2E, so this is recorded as a harness prerequisite, not counted separately. |
| Independent local normal flow | PASS | Supplied scan OCR produced “THE NIGHT READING ROOM”; text edit, source highlight, figure crop, invalid-text-file recovery, and ZIP export worked. ZIP contained README, Markdown, text, HTML, `source-map.json`, source image, and crop. |
| Independent local PDF import | PASS | A raster PDF made from the supplied scan produced one page and a usable Recognize action with no console error. |
| Live deployment identity | PASS | SHA-256 matched candidate build exactly: `index.html` `13cab3…`, `assets/main-Dawi2nqS.js` `86e860…`. |
| Live PWA offline reload | PASS | Service worker controlled `https://scan-reading-pack.sociobot.in/sw.js`; after first visit, offline reload retained the H1 and showed “You’re offline.” |
| Accessibility / responsive | PASS | Desktop and 390px live scans of `/`, `/privacy/`, `/terms/`, and `/?demo=1`: 0 Axe serious/critical issues, no horizontal overflow, no console/page errors. Keyboard focus ring was a visible cyan 3px outline; reduced-motion transition duration was `0s`. |
| Lighthouse mobile, live | PASS | Performance 99; Accessibility 100; LCP 1.5 s; CLS 0.001; transfer 137 KiB. |
| Privacy network smoke test | PASS with scope caveat | Import/OCR contacted only same-origin fonts, app assets, self-hosted OCR/WASM/model, and blob URLs. License verification is deliberately the Sociobot API; no analytics, CDN font, or tracker was observed. This is not a substitute for the missing claim test. |
| Rate limit | PASS | Burst to the declared Sociobot license verify endpoint using a fresh invalid token: requests 1–30 returned 200; request 31 returned `429`, `Retry-After: 3` (also `x-ratelimit-after: 3`). |

## Defects

### Critical

1. **Missing claim contract and all claim tests.** `.factory/claims.json` does
   not exist. This is explicitly release-blocking and leaves public claims
   unverified from the demo entry point.
2. **No mandatory one-click sandbox demo.** There is no “Try it with sample
   data” control, no shipped sample trial, no Demo/Reset/Start-for-real banner,
   no isolated demo namespace, and no `.factory/demo.md`. `/demo` and
   `/?demo=1` are indistinguishable from `/` and use ordinary storage.

### High

1. **The first screen does not state the intended user in plain words.** It
   describes the output but not “readers with scanned books or reports” (or an
   equivalent). More importantly, it lacks the required sample-data first
   action.

### Medium

1. **Security response policy incomplete.** Live root, app asset, service
   worker, manifest, and hero responses have HSTS, `nosniff`, and a referrer
   policy, but no `Content-Security-Policy` header.
2. **Hashed static assets are not immutable-cached.** Live app JS, service
   worker, manifest, and AVIF all return `Cache-Control: public,
   must-revalidate, max-age=30`, rather than a long-lived immutable asset
   policy. This undermines the prescribed static/PWA caching strategy.
3. **Missing standard public metadata / error route.** The source has no
   canonical, Open Graph, Twitter-card, or Apple-touch metadata. A nonexistent
   live path returns the normal application shell with HTTP 200 instead of the
   required designed 404 route.

## Notes and next verification

Core local conversion behavior is substantially functional and the fresh live
deployment is the tested commit; this is not a deployment-only failure. Repair
the critical demo and claims contract first, then rerun every command in the
new claims manifest from `/?demo=1` or `/demo` in a clean browser context.
Also verify that demo writes never use the real IndexedDB namespace, and retest
the response-header and cache-policy fixes.
