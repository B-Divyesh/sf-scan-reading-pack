import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';

test('landing page is accessible and responsive', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Scan Reading Pack/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Turn a scan into text you can trace');
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

test('imports a scan, persists it, and exposes the OCR action', async ({ page }) => {
  await page.goto('/');
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
  await expect(page.getByRole('button', { name: /sample-scan/ })).toBeVisible();
  await page.getByRole('button', { name: /sample-scan/ }).click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('recognizes a page locally and enables export', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The real OCR smoke test runs once.');
  await page.goto('/');
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
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Turn a scan into text you can trace');
});
