# Scan Reading Pack

Scan Reading Pack is for readers with scanned books or reports who need a
selectable reading pack with a route back to each source page. It includes
review tools, figure crops, project backup, and a ZIP reading-pack export.

## Try the demo

Open `/demo/` for a one-click sample reading pack. The sample uses a separate
browser-only workspace and can be reset or discarded with **Start for real**.
See [`.factory/demo.md`](.factory/demo.md) for the sample and storage details.

## Run, test, and build

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

The production build is `dist/`, with `dist/index.html` at its root. Deploy it
as a static site with `staticwebapp.config.json` included.

Every visitor-facing claim and its exact sandbox regression is listed in
[`.factory/claims.json`](.factory/claims.json). Run an individual check with
the command recorded there, for example:

```bash
npm run test:e2e -- --grep @claim:offline-reload
```

## Privacy and purchase

The demo’s requests stay on the same origin. Personal source pages and project
data are stored in the browser. License verification and checkout use the
Sociobot API only when a visitor chooses those actions. There are no analytics,
tracking pixels, remote fonts, or runtime CDN scripts.

The free edition recognizes five pages per project and keeps correction,
backup, and core reading-pack export available. A **$19 USD one-time unlock**
adds unlimited-page OCR and SSML export. See `/privacy/` and `/terms/`.

For a staging billing build:

```bash
VITE_BILLING_BASE=https://pilot-api.sociobot.in npm run build
```

## License

MIT. See [`LICENSE`](LICENSE).
