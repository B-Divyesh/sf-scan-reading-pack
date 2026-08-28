import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { unzipSync, strFromU8 } from 'fflate';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path, { join } from 'node:path';
import { tmpdir } from 'node:os';

async function seedSixPageProject(page: Page, title: string): Promise<void> {
  await page.evaluate(async ({ projectTitle }) => {
    const image = await fetch('/assets/hero-workbench.webp').then((response) => response.blob());
    const pages = Array.from({ length: 6 }, (_, index) => ({
      id: `entitlement-page-${index + 1}`,
      number: index + 1,
      width: 1200,
      height: 800,
      image: image.slice(0, image.size, image.type),
      figures: [],
      status: index < 5 ? 'done' : 'ready',
      blocks: index < 5 ? [{
        id: `entitlement-line-${index + 1}`,
        text: `Recognized page ${index + 1}.`,
        originalText: `Recognized page ${index + 1}.`,
        confidence: 99,
        reviewed: true,
        box: { x0: 20, y0: 20, x1: 400, y1: 80 },
      }] : [],
    }));
    const document = {
      id: `entitlement-${crypto.randomUUID()}`,
      title: projectTitle,
      sourceName: 'six-page-fixture.webp',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pages,
    };
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('scan-reading-pack', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('documents', { keyPath: 'id' });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const transaction = request.result.transaction('documents', 'readwrite');
        transaction.objectStore('documents').put(document);
        transaction.oncomplete = () => { request.result.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }, { projectTitle: title });
}

async function openSixthPage(page: Page, title: string): Promise<void> {
  await page.reload();
  await page.getByRole('button', { name: new RegExp(title) }).click();
  for (let index = 0; index < 5; index++) await page.locator('#next-page').click();
  await expect(page.getByRole('heading', { name: 'Page 6', exact: true })).toBeVisible();
}

test('landing page is accessible and responsive', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Scan Reading Pack/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Make reading packs from scanned pages');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client);
  expect(consoleErrors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('landing.png'), fullPage: true });
});

test('@claim:scan-import imports a scan into the demo workspace and persists it', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: '← Library' }).click();
  await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
  await expect(page.getByRole('heading', { level: 1, name: 'sample-scan' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Page 1', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Recognize this page/ })).toBeVisible();
  await page.getByRole('button', { name: 'Extract a figure' }).click();
  await page.locator('#scan-stage').scrollIntoViewIfNeeded();
  const stage = await page.locator('#scan-stage').boundingBox();
  if (!stage) throw new Error('Source page stage is missing');
  await page.mouse.move(stage.x + stage.width * .28, stage.y + stage.height * .28);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width * .72, stage.y + stage.height * .72);
  await page.mouse.up();
  await expect(page.getByText('1 figure saved from this page')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'sample-scan' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('@regression: a successful import clears an earlier invalid-import alert', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop recovery flow covers this import-state regression.');
  await page.goto('/demo/');
  await page.getByRole('button', { name: '← Library' }).click();
  const directory = mkdtempSync(join(tmpdir(), 'scan-reading-pack-'));
  const oversizedFile = join(directory, 'too-large.png');
  writeFileSync(oversizedFile, Buffer.alloc(80 * 1024 * 1024 + 1));
  try {
    await page.locator('#file-input').setInputFiles(oversizedFile);
    await expect(page.getByRole('alert')).toContainText('80 MB or smaller');
    await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
    await expect(page.getByRole('heading', { level: 1, name: 'sample-scan' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('@claim:local-ocr recognizes an imported scan in the browser', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The real OCR smoke test runs once.');
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Start for real' }).first().click();
  await expect(page).toHaveURL('/');
  await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
  await page.getByRole('button', { name: /Recognize this page/ }).click();
  const transcript = page.locator('textarea').first();
  await expect(transcript).toBeVisible({ timeout: 90_000 });
  await expect(transcript).toContainText(/NIGHT|READING/i);
  await expect(page.getByRole('button', { name: /Export reading pack/ })).toBeEnabled();
});

test('installed app shell reloads offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('You’re offline')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Make reading packs from scanned pages');
});

test('@claim:demo-sandbox loads a one-click sample in an isolated workspace', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — Scan Reading Pack');
  await expect(page.getByRole('heading', { level: 1, name: /Night Reading Room/ })).toBeVisible();
  await expect(page.getByLabel('Demo controls')).toContainText('Demo — sample data');
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databases).toContain('demo:scan-reading-pack');
  expect(databases).not.toContain('scan-reading-pack');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Sample reading pack reset.')).toBeAttached();
  await expect(page.getByRole('heading', { level: 1, name: /Night Reading Room/ })).toBeVisible();
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — Scan Reading Pack');
  await expect(page.getByRole('heading', { level: 1, name: /Night Reading Room/ })).toBeVisible();
});

test('@claim:offline-reload keeps the sample reading pack available after the first visit', async ({ page, context }) => {
  await page.goto('/demo/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('You’re offline')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: /Night Reading Room/ })).toBeVisible();
  await expect(page.getByLabel('Demo controls')).toBeVisible();
});

test('@claim:source-trace lights the matching sample page region', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Show line 2 on source page' }).click();
  await expect(page.locator('.source-highlight')).toBeVisible();
  await expect(page.locator('.text-block.selected')).toContainText('At closing time');
});

test('@claim:pack-export downloads a reading pack with text and page coordinates', async ({ page }) => {
  await page.goto('/demo/');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reading pack' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/night-reading-room-sample-reading-pack\.zip/);
  const file = await download.path();
  if (!file) throw new Error('Download path is missing');
  const archive = unzipSync(readFileSync(file));
  expect(Object.keys(archive)).toEqual(expect.arrayContaining(['reading.md', 'reading.txt', 'reading.html', 'source-map.json', 'source-pages/page-1.webp']));
  expect(strFromU8(archive['source-map.json'])).toContain('demo-line-2');
});

test('@claim:browser-private keeps sample processing on the same origin', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { level: 1, name: /Night Reading Room/ })).toBeVisible();
  await page.getByRole('button', { name: '← Library' }).click();
  await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
  await expect(page.getByRole('heading', { level: 1, name: 'sample-scan' })).toBeVisible();
  const origins = [...new Set(requests.filter((url) => url.startsWith('http')).map((url) => new URL(url).origin))];
  expect(origins).toEqual(['http://127.0.0.1:4173']);
  const storage = await page.evaluate(() => Object.keys(localStorage));
  expect(storage.filter((key) => key.startsWith('sb_license:'))).toEqual([]);
});

test('@claim:five-page-free-limit prevents a sixth page from being recognized without an unlock', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Start for real' }).first().click();
  await expect(page).toHaveURL('/');
  await seedSixPageProject(page, 'Six-page free limit');
  await openSixthPage(page, 'Six-page free limit');
  await page.getByRole('button', { name: /Recognize this page/ }).click();
  await expect(page.getByRole('alert')).toContainText('recognizes up to 5 pages per project');
});

test('@claim:one-time-unlock verifies its $19 checkout and unlocks page six plus SSML export', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Start for real' }).first().click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('$19 USD')).toBeVisible();
  await expect(page.getByRole('link', { name: /Buy the \$19 lifetime unlock/ })).toHaveAttribute('href', /api\.sociobot\.in\/api\/v1\/products\/scan-reading-pack\/checkout/);
  await page.evaluate(() => {
    localStorage.setItem('sb_license:scan-reading-pack', 'test-valid-license');
    localStorage.setItem('sb_license_verdict:scan-reading-pack', JSON.stringify({ token: 'test-valid-license', valid: true, checkedAt: Date.now() }));
  });
  await seedSixPageProject(page, 'Six-page unlocked');
  await openSixthPage(page, 'Six-page unlocked');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reading pack' }).click();
  const download = await downloadPromise;
  const file = await download.path();
  if (!file) throw new Error('Download path is missing');
  expect(Object.keys(unzipSync(readFileSync(file)))).toContain('audiobook.ssml');
  await page.getByRole('button', { name: /Recognize this page/ }).click();
  await expect(page.getByText('Reading page 6 locally…')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('@regression: mobile brand and footer legal links have 44px touch targets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'This measurement is specific to the 390px verifier viewport.');
  await page.goto('/');
  for (const locator of [page.locator('.brand'), page.locator('footer a[href="/privacy/"]'), page.locator('footer a[href="/terms/"]')]) {
    const box = await locator.boundingBox();
    expect(box, 'touch target must have a layout box').not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});
