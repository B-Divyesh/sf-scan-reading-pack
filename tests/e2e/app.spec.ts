import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { unzipSync, strFromU8 } from 'fflate';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path, { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';

function onePagePdf(): Buffer {
  const stream = '0.15 0.4 0.55 rg 20 20 120 80 re f\n';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 160 120] /Contents 4 0 R /Resources << >> >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

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

test('@regression: complete desktop first-read content fits at 1280 by 720', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'This is the verifier desktop baseline geometry check.');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  for (const selector of ['h1', '.lede', '.hero-actions', '.hero-facts']) {
    const box = await page.locator(selector).boundingBox();
    expect(box, `${selector} must have a layout box`).not.toBeNull();
    expect(box!.y, `${selector} must start inside the viewport`).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height, `${selector} must end inside the viewport`).toBeLessThanOrEqual(720);
  }
  await expect(page.locator('.hero-actions > span')).toBeVisible();
  await expect(page.locator('.hero-facts > li')).toHaveCount(3);
});

test('@regression: brand visible name is included in its accessible name', async ({ page }) => {
  await page.goto('/');
  // The wordmark contracts to its visible SR monogram on a narrow screen.
  await expect(page.locator('.brand')).toHaveAccessibleName(page.viewportSize()?.width === 390 ? 'SR' : /SR\s*Scan Reading Pack/);
  const results = await new AxeBuilder({ page })
    .withTags(['experimental'])
    .withRules(['label-content-name-mismatch'])
    .analyze();
  expect(results.violations.filter((item) => item.id === 'label-content-name-mismatch')).toEqual([]);
});

test('@regression: workbench visible labels are included in accessible names', async ({ page }) => {
  await page.goto('/demo/');
  for (let index = 1; index <= 5; index += 1) {
    await expect(page.getByRole('button', { name: new RegExp(`P1 · L${index}.*show on source page`, 'i') })).toBeVisible();
  }
  const results = await new AxeBuilder({ page })
    .withTags(['experimental'])
    .withRules(['label-content-name-mismatch'])
    .analyze();
  expect(results.violations.filter((item) => item.id === 'label-content-name-mismatch')).toEqual([]);
});

test('@claim:scan-import imports a scan into the demo workspace and persists it', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: '← Library' }).click();
  await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
  await expect(page.getByRole('heading', { level: 1, name: 'sample-scan' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Page 1', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Recognize this page/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'sample-scan' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('@claim:scan-file-types imports each stated scan format', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'The format matrix runs once; both viewports cover the shared import flow.');
  const png = readFileSync(path.resolve('tests/fixtures/sample-scan.png'));
  const formats = [
    { name: 'format-check.png', mimeType: 'image/png', buffer: png },
    { name: 'format-check.jpg', mimeType: 'image/jpeg', buffer: await sharp(png).jpeg().toBuffer() },
    { name: 'format-check.webp', mimeType: 'image/webp', buffer: await sharp(png).webp().toBuffer() },
    { name: 'format-check.pdf', mimeType: 'application/pdf', buffer: onePagePdf() },
  ];
  for (const format of formats) {
    await page.goto('/demo/');
    await page.getByRole('button', { name: '← Library' }).click();
    await page.locator('#file-input').setInputFiles(format);
    await expect(page.getByRole('heading', { level: 1, name: format.name.replace(/\.[^.]+$/, '') })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 2, name: 'Page 1', exact: true })).toBeVisible();
  }
});

test('@claim:figure-crop saves an extracted figure in the project backup', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: '← Library' }).click();
  await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
  await page.getByRole('button', { name: 'Extract a figure' }).click();
  await page.locator('#scan-stage').scrollIntoViewIfNeeded();
  const stage = await page.locator('#scan-stage').boundingBox();
  if (!stage) throw new Error('Source page stage is missing');
  await page.mouse.move(stage.x + stage.width * .28, stage.y + stage.height * .28);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width * .72, stage.y + stage.height * .72);
  await page.mouse.up();
  await expect(page.getByText('1 figure saved from this page')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up project' }).click();
  const download = await downloadPromise;
  const file = await download.path();
  if (!file) throw new Error('Backup download path is missing');
  const backup = JSON.parse(readFileSync(file, 'utf8'));
  expect(backup.documents[0].pages[0].figures).toHaveLength(1);
  expect(backup.documents[0].pages[0].figures[0].blob).toMatch(/^data:image\/webp;base64,/);
});

test('@claim:correction-queue saves a checked low-confidence correction', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: /Needs review/ }).click();
  await expect(page.getByRole('heading', { name: 'Confidence queue' })).toBeVisible();
  const line = page.getByRole('textbox', { name: 'Recognized text, page 1 line 1' });
  await line.fill('Each page kept a route back to its source.');
  await line.blur();
  await expect(page.getByText('Queue clear')).toBeVisible();
  await page.reload();
  await expect.poll(() => page.locator('textarea').nth(2).inputValue()).toBe('Each page kept a route back to its source.');
});

test('@claim:confidence-preservation keeps the original score after a correction', async ({ page }) => {
  await page.goto('/demo/');
  const line = page.getByRole('textbox', { name: 'Recognized text, page 1 line 3' });
  await expect(line.locator('xpath=..').getByText('Check · 78%')).toBeVisible();
  await line.fill('Each corrected page keeps a route back to its source.');
  await line.blur();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up project' }).click();
  const backupPath = await (await downloadPromise).path();
  if (!backupPath) throw new Error('Backup download path is missing');
  const block = JSON.parse(readFileSync(backupPath, 'utf8')).documents[0].pages[0].blocks.find((item: { id: string }) => item.id === 'demo-line-3');
  expect(block).toMatchObject({ text: 'Each corrected page keeps a route back to its source.', originalText: 'Each page kept a route back to the paper from which it came.', confidence: 78 });
});

test('@claim:project-backup downloads and restores after an invalid retry under production CSP', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  const response = await page.goto('/demo/');
  expect(response?.headers()['content-security-policy']).toContain("connect-src 'self' https://api.sociobot.in");
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up project' }).click();
  const download = await downloadPromise;
  const file = await download.path();
  if (!file) throw new Error('Backup download path is missing');
  const backup = JSON.parse(readFileSync(file, 'utf8'));
  expect(backup.format).toBe('scan-reading-pack/project-v1');
  expect(backup.documents[0].pages[0].image).toMatch(/^data:image\/svg\+xml;base64,/);
  expect(backup.documents[0].pages[0].blocks).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'demo-line-2' })]));
  await page.getByRole('button', { name: 'Start for real' }).first().click();
  await expect(page).toHaveURL('/');
  await page.locator('#restore-input').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(page.getByRole('alert')).toContainText('not a valid Scan Reading Pack backup');
  await page.locator('#restore-input').setInputFiles(file);
  await expect(page.locator('#live-status')).toContainText('1 project restored.');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: /Night Reading Room/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Night Reading Room/ })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test('@claim:local-deletion removes a project and a saved license from this device', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
  await expect(page.getByRole('heading', { level: 1, name: 'sample-scan' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete project' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Continue a reading pack' })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('scan-reading-pack', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const count = await new Promise<number>((resolve, reject) => {
      const request = database.transaction('documents').objectStore('documents').count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return count;
  })).toBe(0);

  await page.evaluate(() => {
    localStorage.setItem('sb_license:scan-reading-pack', 'recorded-valid-license');
    localStorage.setItem('sb_license_verdict:scan-reading-pack', JSON.stringify({ token: 'recorded-valid-license', valid: true, checkedAt: Date.now() }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Remove license from this device' }).click();
  await expect(page.getByRole('link', { name: /Buy the \$19 lifetime unlock/ })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('sb_license')))).toEqual([]);
});

test('@regression: invalid imports recover without a console error', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop recovery flow covers this import-state regression.');
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/demo/');
  await page.getByRole('button', { name: '← Library' }).click();
  const directory = mkdtempSync(join(tmpdir(), 'scan-reading-pack-'));
  const oversizedFile = join(directory, 'too-large.png');
  const unsupportedFile = join(directory, 'unsupported.txt');
  writeFileSync(oversizedFile, Buffer.alloc(80 * 1024 * 1024 + 1));
  writeFileSync(unsupportedFile, 'This is not an image.');
  try {
    await page.locator('#file-input').setInputFiles(oversizedFile);
    await expect(page.getByRole('alert')).toContainText('80 MB or smaller');
    await page.locator('#file-input').setInputFiles(unsupportedFile);
    await expect(page.getByRole('alert')).toContainText('could not be opened');
    await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
    await expect(page.getByRole('heading', { level: 1, name: 'sample-scan' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('@claim:local-ocr recognizes an imported scan in the browser', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'The real OCR smoke test runs once on the desktop project.');
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

test('@claim:offline-reload recognizes a later import offline after language files have cached', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'The browser OCR cache path runs once; the shared offline shell is covered on both viewports.');
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Start for real' }).first().click();
  await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
  await page.getByRole('button', { name: /Recognize this page/ }).click();
  await expect(page.locator('textarea').first()).toContainText(/NIGHT|READING/i, { timeout: 90_000 });
  await page.getByRole('button', { name: '← Library' }).click();
  await context.setOffline(true);
  await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
  await expect(page.getByRole('heading', { level: 1, name: 'sample-scan' })).toBeVisible();
  await page.getByRole('button', { name: /Recognize this page/ }).click();
  await expect(page.locator('textarea').first()).toContainText(/NIGHT|READING/i, { timeout: 90_000 });
  await expect(page.getByText('You’re offline')).toBeVisible();
});

test('@claim:source-trace lights the matching source region for every sample line', async ({ page }) => {
  await page.goto('/demo/');
  for (let index = 1; index <= 5; index++) {
    await page.getByRole('button', { name: new RegExp(`P1 · L${index}.*show on source page`, 'i') }).click();
    await expect(page.locator('.source-highlight')).toBeVisible();
    await expect(page.locator('.text-block.selected')).toContainText(`L${index}`);
  }
});

test('@regression: every desktop trace control is pointer reachable with a visible focus ring', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'This is the verifier 1440 by 900 overlap check.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/demo/');
  const scroller = page.locator('.blocks');
  for (let index = 1; index <= 5; index += 1) {
    const trace = page.getByRole('button', { name: new RegExp(`P1 · L${index}.*show on source page`, 'i') });
    await trace.scrollIntoViewIfNeeded();
    const geometry = await trace.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const styles = getComputedStyle(element);
      return {
        hit: top === element || element.contains(top),
        outlineStyle: styles.outlineStyle,
        outlineWidth: parseFloat(styles.outlineWidth),
        top: rect.top,
        bottom: rect.bottom,
      };
    });
    const scrollerBox = await scroller.boundingBox();
    expect(scrollerBox).not.toBeNull();
    expect(geometry.top).toBeGreaterThanOrEqual(scrollerBox!.y);
    expect(geometry.bottom).toBeLessThanOrEqual(scrollerBox!.y + scrollerBox!.height);
    expect(geometry.hit, `line ${index} must own its pointer hit target`).toBe(true);
    await trace.focus();
    await expect(trace).toBeFocused();
    const focus = await trace.evaluate((element) => {
      const styles = getComputedStyle(element);
      return { style: styles.outlineStyle, width: parseFloat(styles.outlineWidth), color: styles.outlineColor };
    });
    expect(focus.style).not.toBe('none');
    expect(focus.width).toBeGreaterThanOrEqual(3);
    expect(focus.color).not.toBe('transparent');
    await trace.click();
    await expect(page.locator('.text-block.selected')).toContainText(`L${index}`);
  }
});

test('@regression: secondary pages link How it works to the home section', async ({ page }) => {
  for (const route of ['/privacy/', '/terms/', '/not-a-real-page']) {
    const response = await page.goto(route);
    if (route === '/not-a-real-page') expect(response?.status()).toBe(404);
    const link = page.locator('.site-header nav a', { hasText: 'How it works' });
    await expect(link).toHaveAttribute('href', '/#how');
    await page.goto('/#how');
    await expect(page).toHaveURL(/\/#how$/);
    await expect(page.locator('#how')).toBeVisible();
  }
});

test('@regression: every public route has no serious or critical accessibility findings', async ({ page }) => {
  for (const route of ['/', '/demo/', '/privacy/', '/terms/', '/not-a-real-page']) {
    const response = await page.goto(route);
    if (route === '/not-a-real-page') expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')),
      `${route} must have no serious or critical Axe findings`,
    ).toEqual([]);
  }
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

test('@claim:browser-private keeps OCR input and output local without upload or telemetry requests', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'The local OCR request audit runs once; normal import remains covered on both viewports.');
  const requests: Array<{ method: string; url: string }> = [];
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Start for real' }).first().click();
  await page.locator('#file-input').setInputFiles(path.resolve('tests/fixtures/sample-scan.png'));
  await expect(page.getByRole('heading', { level: 1, name: 'sample-scan' })).toBeVisible();
  await page.getByRole('button', { name: /Recognize this page/ }).click();
  await expect(page.locator('textarea').first()).toContainText(/NIGHT|READING/i, { timeout: 90_000 });
  const origin = 'http://127.0.0.1:4173';
  // Tesseract receives the selected source via a browser-created blob URL.
  // Chromium exposes that local blob as a UUID path in Playwright's request
  // observer; it is not an upload endpoint and has no network host change.
  const allowed = /^\/(?:$|demo\/?$|assets\/|fonts\/|icons\/|ocr\/|tessdata\/|manifest\.webmanifest$|sw\.js$|workbox-[^/]+\.js$)/;
  for (const request of requests) {
    const url = new URL(request.url);
    expect(url.origin).toBe(origin);
    expect(request.method).toBe('GET');
    if (url.protocol === 'blob:') expect(url.pathname).toMatch(new RegExp(`^${origin.replaceAll('.', '\\.')}\\/[\\da-f-]{36}$`));
    else expect(url.pathname).toMatch(allowed);
  }
  const storage = await page.evaluate(() => Object.keys(localStorage));
  expect(storage.filter((key) => key.startsWith('sb_license:'))).toEqual([]);
});

test('@claim:no-third-party-runtime requests only declared self-hosted app resources', async ({ page }) => {
  const requests: Array<{ method: string; url: string }> = [];
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const origin = 'http://127.0.0.1:4173';
  const allowed = /^\/(?:$|assets\/|fonts\/|icons\/|manifest\.webmanifest$|sw\.js$|workbox-[^/]+\.js$)/;
  for (const request of requests) {
    expect(new URL(request.url).origin).toBe(origin);
    expect(request.method).toBe('GET');
    expect(new URL(request.url).pathname).toMatch(allowed);
  }
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

test('@claim:one-time-unlock verifies its $19 checkout and unlocks page six plus SSML export', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'The entitlement path runs once on the desktop project to avoid concurrent OCR workers.');
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

test('@claim:daily-license-check rechecks an active license only after 24 hours', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'The exact entitlement timing boundary runs once.');
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block' });
  const page = await context.newPage();
  let verifyRequests = 0;
  await page.route('https://api.sociobot.in/api/v1/products/scan-reading-pack/verify?license=daily-license', async (route) => {
    verifyRequests += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok' }) });
  });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('sb_license:scan-reading-pack', 'daily-license');
    localStorage.setItem('sb_license_verdict:scan-reading-pack', JSON.stringify({ token: 'daily-license', valid: true, checkedAt: Date.now() - 86_400_000 + 1_000 }));
  });
  await page.reload();
  await expect(page.getByText('Full pack unlocked')).toBeVisible();
  expect(verifyRequests).toBe(0);
  await page.evaluate(() => {
    const key = 'sb_license_verdict:scan-reading-pack';
    const cached = JSON.parse(localStorage.getItem(key)!);
    cached.checkedAt = Date.now() - 86_400_000 - 1_000;
    localStorage.setItem(key, JSON.stringify(cached));
  });
  await page.reload();
  await expect(page.getByText('Full pack unlocked')).toBeVisible();
  expect(verifyRequests).toBe(1);
  await page.reload();
  expect(verifyRequests).toBe(1);
  await context.close();
});

test('@claim:refund-revocation removes paid access after a revoked verdict', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'The recorded billing revocation path runs once.');
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block', acceptDownloads: true });
  const page = await context.newPage();
  await page.route('https://api.sociobot.in/api/v1/products/scan-reading-pack/verify?license=refunded-license', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'revoked' }) });
  });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('sb_license:scan-reading-pack', 'refunded-license');
    localStorage.setItem('sb_license_verdict:scan-reading-pack', JSON.stringify({ token: 'refunded-license', valid: true, checkedAt: Date.now() - 86_400_001 }));
  });
  await page.reload();
  await expect(page.getByText('This license is no longer active because billing reported it as revoked.')).toBeVisible();
  await expect(page.getByText('Full pack unlocked')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Buy the \$19 lifetime unlock/ })).toBeVisible();
  const cached = await page.evaluate(() => JSON.parse(localStorage.getItem('sb_license_verdict:scan-reading-pack')!));
  expect(cached).toMatchObject({ token: 'refunded-license', valid: false, reason: 'revoked' });
  await seedSixPageProject(page, 'Six-page revoked');
  await openSixthPage(page, 'Six-page revoked');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reading pack' }).click();
  const archivePath = await (await downloadPromise).path();
  if (!archivePath) throw new Error('Revoked-license export path is missing');
  expect(Object.keys(unzipSync(readFileSync(archivePath)))).not.toContain('audiobook.ssml');
  await page.getByRole('button', { name: /Recognize this page/ }).click();
  await expect(page.getByRole('alert')).toContainText('recognizes up to 5 pages per project');
  await context.close();
});

test('@regression: every visible mobile control has a 44px touch target', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'This measurement is specific to the 390px verifier viewport.');
  await page.goto('/demo/');
  const controls = page.locator('a:visible, button:visible, label.file-button:visible');
  const count = await controls.count();
  expect(count).toBeGreaterThan(10);
  for (let index = 0; index < count; index++) {
    const locator = controls.nth(index);
    const box = await locator.boundingBox();
    expect(box, 'touch target must have a layout box').not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test('@regression: the 390px landing page reflows at 200% text size', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'This measurement is specific to the 390px verifier viewport.');
  await page.goto('/');
  await page.evaluate(() => {
    const rootRule = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .find((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === ':root');
    if (!rootRule) throw new Error('Root type rule is missing');
    rootRule.style.setProperty('font-size', '200%', 'important');
  });
  await page.locator('.pricing-section').scrollIntoViewIfNeeded();
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
});
