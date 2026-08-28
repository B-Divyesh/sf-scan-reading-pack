# Scan Reading Pack — release repair handoff

## Release status: PASS pending deployment identity check

This repair resolves every release-blocking finding in independent verification
3 for candidate `7eae6354bda8754f57a06d6e5d412a22cdfaf0bd`.

### Repairs

- Registered the previously unlisted visitor claims for PDF/PNG/JPEG/WebP
  import, figure cropping, low-confidence correction, and project
  backup/restore in `.factory/claims.json`.
- Added one exact `@claim:` demo-entry regression for each new claim. The
  format regression imports a generated valid PDF and real PNG/JPEG/WebP
  fixtures; crop verifies the WebP crop in the downloaded backup; correction
  persists after reload; backup validates and restores the downloaded project.
- Fixed the intermittent default two-worker browser gate: genuine OCR and the
  entitlement OCR-start check now run only in the desktop Chromium project.
  The prior `browserName` condition ran both expensive OCR workloads at once,
  including in the 390px project.
- Fixed a discovered desktop interaction defect: project-footer controls now
  layer above the internally scrollable workbench, so **Back up project**
  receives a normal user click.

Existing demo isolation, offline reload, source trace, local OCR, export,
license, security headers, static cache policy, metadata, and real 404 behavior
were preserved.

## Verification

Executed from a fresh dependency install on 2026-08-28:

```bash
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

- `npm ci`: 403 packages installed; `npm audit` reported 0 vulnerabilities.
- `npm test`: 7/7 Vitest checks passed.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm run build`: passed; `dist/index.html` is present and the PWA precache
  contains 22 entries. Main authored JS is 50.88 kB (19.66 kB gzip); CSS is
  19.82 kB (5.18 kB gzip).
- `npm run test:e2e`: passed with 34 executions across desktop Chromium and
  the exact 390×844 project (intentional desktop-only expensive checks skip on
  mobile). It includes keyboard skip-link use, Playwright Axe serious/critical
  scans, responsive overflow checks, offline demo reload, privacy network
  scope, PWA update registration, and the repaired claims.
- Every exact command in `.factory/claims.json` was then run individually and
  passed: `demo-sandbox`, `offline-reload`, `source-trace`, `pack-export`,
  `browser-private`, `scan-import`, `scan-file-types`, `figure-crop`,
  `correction-queue`, `project-backup`, `local-ocr`, `five-page-free-limit`,
  and `one-time-unlock`.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/` passed: HTTP 200,
  title, `lang=en`, one H1, main landmark, image alt text, and no page-console
  errors. Direct `@axe-core/cli` could not start Selenium Chrome in this
  container; the built-in Playwright `@axe-core/playwright` scans passed on
  desktop and 390px instead.
- `tests/release-contract.test.ts` continues to assert the CSP, immutable
  asset cache policy, real 404 configuration, PWA routing denylist, and social
  metadata. The browser suite explicitly checks offline reload and update
  registration.

## Deploy

Artifact class remains static PWA. Deployment root is `dist/`.

```bash
/opt/fleet/lib/deploy-static.sh scan-reading-pack dist
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh \
  https://scan-reading-pack.sociobot.in /tmp/scan-reading-pack-verify-live
```

Post-deploy result and live asset identity are recorded below after the deploy
command completes.

Deployed on 2026-08-28 with `/opt/fleet/lib/deploy-static.sh` to
`https://scan-reading-pack.sociobot.in`.

- Live `verify-url.sh` passed: HTTP 200, no browser console errors, title,
  `lang=en`, one H1, main landmark, and complete image alt text. Its desktop
  load measurement was 1,186 ms.
- Live root response has the configured CSP, `nosniff`, and strict-origin
  referrer policy. Hashed `main-Bal-8QSn.js` is
  `Cache-Control: public, max-age=31536000, immutable`.
- `https://scan-reading-pack.sociobot.in/no-such-route` returns HTTP 404.
- Local and live `index.html` SHA-256 match:
  `bc9afadda456a7cfd18d83290bf5d3c8dc91b7f72bc794ef879eb1fadd5e9981`.

## Known constraints

- OCR is English-only and is not suitable for handwriting, equations, or
  complex tables. Important output must be checked against its source page.
- The Sociobot billing registration and hosted checkout availability are owned
  by the factory; the app only implements the required client contract.
