import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');

describe('release contract regressions', () => {
  it('ships the verifier-required claim and demo documents', () => {
    const claims = JSON.parse(read('.factory/claims.json')) as Array<{ id: string; test: string }>;
    expect(claims.map((claim) => claim.id)).toEqual(expect.arrayContaining([
      'demo-sandbox', 'offline-reload', 'source-trace', 'pack-export', 'browser-private',
      'scan-import', 'scan-file-types', 'figure-crop', 'correction-queue', 'project-backup',
      'local-ocr', 'five-page-free-limit', 'one-time-unlock',
    ]));
    for (const claim of claims) expect(read('tests/e2e/app.spec.ts')).toContain(`@claim:${claim.id}`);
    expect(read('.factory/demo.md')).toContain('demo:scan-reading-pack');
  });

  it('declares secure static-host headers, immutable assets, and a real 404 response', () => {
    const config = JSON.parse(read('staticwebapp.config.json')) as { globalHeaders: Record<string, string>; routes: Array<{ route: string; headers?: Record<string, string> }>; responseOverrides: Record<string, { rewrite: string; statusCode: number }> };
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.routes.find((route) => route.route === '/assets/*')?.headers?.['Cache-Control']).toContain('immutable');
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
    expect(read('404.html')).toContain('src/main.ts');
    expect(read('public/staticwebapp.config.json')).toBe(read('staticwebapp.config.json'));
    expect(read('vite.config.ts')).toContain('navigateFallbackDenylist');
  });

  it('ships canonical social metadata with a 1200 by 630 product image', () => {
    const html = read('index.html');
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:card"');
    expect(readFileSync(resolve(root, 'public/assets/scan-reading-pack-social.jpg')).subarray(0, 2).toString('hex')).toBe('ffd8');
  });
});
