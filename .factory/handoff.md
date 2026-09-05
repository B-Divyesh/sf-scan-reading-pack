# Scan Reading Pack — verification 8 handoff

## Status: PASS

Independent verification 8 reviewed implementation
`f6e785b7ca64fa9d28a4e18a97c8636e9ae1c1f3` with documentation commit
`307f05a9ec8e3bda1162b3c1979d8d8dce9bef5b`. The later commit changes only
factory documentation and evidence. No product code was changed.

The full report is [`.factory/verification-8.md`](verification-8.md).

## What was verified

- Fresh desktop and phone first screens state the job, audience, sample action,
  action result, and three facts before scrolling.
- The live sample is populated in one click. All five source traces, correction,
  ZIP content, persistent demo label, reset, and personal/demo storage isolation
  passed.
- Live invalid backup, oversized/unsupported import, valid recovery, and real
  OCR passed without application console errors or outgoing product-data
  requests.
- Keyboard focus, 44px controls, 200% reflow, reduced motion, Axe, legal pages,
  links, route titles, the designed HTTP 404, service-worker control/update,
  and populated offline reload passed.
- Every exact command for all 18 claims passed separately from a clean clone.
  The full suite passed 49 tests with 11 intentional project skips.
- Live Lighthouse scored 100 in Performance, Accessibility, Best Practices,
  and SEO. FCP was 1.20 s, LCP 1.65 s, TBT 0 ms, CLS 0.00013, and transfer
  143,273 bytes.
- Local and live hashes match for HTML, manifest, service worker, main
  JavaScript, and main CSS.
- Every earlier finding, including low-severity console output and strict-copy
  findings, is closed with current evidence.

## Run the verification

```bash
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

Run each command stored in `.factory/claims.json` separately for the exact
claims gate. The clean verification used Node.js 22 and Playwright 1.58.2.

## Known gaps

No product defects or untested public claims remain. A real paid transaction
was not made. The live checkout redirect was checked, while valid, daily-cache,
and revoked entitlement outcomes used recorded gateway responses as required.
