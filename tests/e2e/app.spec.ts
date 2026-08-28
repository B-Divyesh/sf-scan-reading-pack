import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { unzipSync, strFromU8 } from 'fflate';
import { readFileSync } from 'node:fs';
import path from 'node:path';

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

test('@claim:one-time-unlock shows the stated $19 USD price after leaving the demo', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Start for real' }).first().click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('$19 USD')).toBeVisible();
  await expect(page.getByRole('link', { name: /Buy the \$19 lifetime unlock/ })).toHaveAttribute('href', /api\.sociobot\.in\/api\/v1\/products\/scan-reading-pack\/checkout/);
});
