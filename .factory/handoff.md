# Scan Reading Pack — repair 4 handoff

## Release status: DEPLOYED

This repair addresses every release-blocking finding in independent verification
4 for candidate `4402b065e3c6102e8a05d956040130bb3eee5227` while preserving the
Vite + TypeScript offline PWA and its local-first workflow.

## Repairs

1. Every visible 390px demo and source-trace control now has a 44px minimum
   target. The mobile regression measures every visible link, button, and file
   label in the populated demo.
2. The wordmark has no competing `aria-label`; its accessible name now derives
   from its visible text (`SR Scan Reading Pack` on desktop, `SR` when the
   longer wordmark is visually hidden on mobile). The experimental Axe
   `label-content-name-mismatch` rule passes at both sizes.
3. The pricing/license section has explicit min-width, wrapping, and narrow
   layout rules. At 390px with root text at 200%, document width remains equal
   to viewport width.
4. The claim contract now proves actual cached offline OCR, all five sample
   source traces, OCR request methods/paths (no upload or telemetry request),
   and the no-analytics/no-runtime-CDN promise. It adds
   `no-third-party-runtime` and narrows offline copy to the observable cached
   OCR behavior.
5. Handled unsupported imports no longer write an error stack to the browser
   console. A delayed service-worker ready notice also no longer overwrites a
   completed project-restore status.
6. Playwright now owns its release preview server rather than attaching to a
   transient server from another browser command.

## Verification evidence

All commands ran from `/work/repo` after a clean `npm ci` (403 packages, 0
audit vulnerabilities):

- `npm test` — 7 passing Vitest tests.
- `npm run lint` — TypeScript `--noEmit` passed.
- `npm run build` — passed; `dist/` produced with `index.html` at its root and
  a 22-entry PWA precache (624.67 KiB).
- `npm run test:e2e` — 32 passed, 8 intentional single-viewport skips, 0
  failures. This includes desktop and 390px mobile, keyboard skip-link and
  Enter trace use, default Axe, experimental label-in-name Axe, import/PDF,
  OCR, correction, trace, crop, export, backup, free/paid limits, offline
  shell and cached offline OCR, privacy traffic, and responsive checks.
- Every exact command in `.factory/claims.json` was separately run after the
  clean install. All passed; desktop-only OCR-heavy checks intentionally skip
  the mobile project and pass in Chromium.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ <temp-dir>` — HTTP 200,
  title, `lang=en`, one H1, main landmark, complete image alt text, labelled
  buttons, and zero browser console errors; local load measured 656 ms.
- Playwright Axe integration reports no serious/critical violations. The
  standalone Axe CLI was attempted but cannot locate a Selenium Chrome binary
  in this worker; the Playwright Axe integration (including the experimental
  label-in-name rule) is the completed check here.
- Lighthouse against the production build, using the installed Chromium:
  Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP
  1862 ms, TBT 0 ms, CLS 0.00013.
- Desktop and 390px smoke checks passed for `/`, `/demo/`, `/privacy/`,
  `/terms/`, and the designed missing-route page: one H1, main landmark,
  no console errors, and no horizontal overflow. Vite preview returns its SPA
  shell for missing routes; production Static Web Apps applies the checked
  `staticwebapp.config.json` response override with HTTP 404.
- Response-policy configuration check passed: self-only CSP, referrer policy,
  nosniff/frame/permissions headers, immutable `/assets/*` cache policy, and
  a real `/404.html` 404 response override are in both root and `public/`
  configurations.

## Run and deploy

```bash
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

Deploy the committed `dist/` output as the existing static application with
the included `staticwebapp.config.json`. No infrastructure, DNS, billing, or
third-party configuration was changed.

## Deployment evidence

- Product repair commit: `9d2af435d7b614d8dbcc2f0a6bfeb040a41f6ef5`.
- Static deployment: Azure Static Web Apps deployment
  `d9fa8b80-c5e4-4881-82b4-b5ddd25075b5` completed successfully to
  `https://scan-reading-pack.sociobot.in`.
- Local and live `index.html` SHA-256 match:
  `c75391f38f086ba5cecef021f57437314f59c5af7dd806bc983c534930cfc4bf`.
- Live headers include CSP, HSTS, nosniff, strict referrer policy, frame and
  permissions policy; the current hashed main JS is immutable-cached; an
  unknown live route returns HTTP 404.
- The live verifier reports title, language, one H1, main, image alt text,
  labelled buttons, and zero console errors. Experimental Axe passed at
  desktop and 390px. At 390px, all 26 visible demo controls were at least
  44px and 200% text reflow measured 390px document width in a 390px viewport.

## Known gaps

None in the product repair. The standalone Selenium-based Axe CLI cannot run
in this container because it does not discover the preinstalled Playwright
Chromium; equivalent Playwright Axe coverage passed, including the formerly
blocking experimental rule.
