import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { unzipSync, strFromU8 } from 'fflate';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const base = 'https://scan-reading-pack.sociobot.in';
const fixture = path.resolve('tests/fixtures/sample-scan.png');
const out = path.resolve('.factory/qa-artifacts/verification-6');
const evidence = { desktop: {}, mobile: {}, reducedMotion: {} };
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requests = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));

  const rootResponse = await page.goto(base, { waitUntil: 'networkidle' });
  assert(rootResponse?.status() === 200, 'Root did not return 200');
  assert(await page.getByRole('heading', { level: 1, name: 'Make reading packs from scanned pages.' }).isVisible(), 'Plain first-read heading missing');
  assert(await page.getByText('For readers with scanned books or reports who need selectable text linked to its source page.').isVisible(), 'Audience sentence missing');
  assert(await page.getByRole('link', { name: 'Try it with sample data' }).isVisible(), 'Sample action missing');
  await page.keyboard.press('Tab');
  assert(await page.getByRole('link', { name: 'Skip to main content' }).evaluate((element) => element === document.activeElement), 'Skip link is not first focus target');
  await page.keyboard.press('Enter');
  assert(await page.locator('main').evaluate((element) => element === document.activeElement), 'Skip link did not focus main');

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForURL(/\/demo\/?$/);
  await page.getByRole('heading', { level: 1, name: /Night Reading Room/ }).waitFor();
  assert(await page.getByRole('heading', { level: 1, name: /Night Reading Room/ }).isVisible(), 'Demo sample did not load');
  assert(/demo — sample data, nothing is saved to your library/i.test(await page.getByLabel('Demo controls').innerText()), 'Persistent demo banner is incomplete');
  const demoDatabases = await page.evaluate(async () => (await indexedDB.databases()).map((item) => item.name));
  assert(demoDatabases.includes('demo:scan-reading-pack'), 'Demo workspace database is missing');
  const personalDocumentCountInDemo = await page.evaluate(async () => {
    if (!(await indexedDB.databases()).some((item) => item.name === 'scan-reading-pack')) return 0;
    return await new Promise((resolve, reject) => {
      const request = indexedDB.open('scan-reading-pack', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const count = request.result.transaction('documents').objectStore('documents').count();
        count.onerror = () => reject(count.error);
        count.onsuccess = () => { request.result.close(); resolve(count.result); };
      };
    });
  });
  assert(personalDocumentCountInDemo === 0, 'Demo populated the personal workspace');
  const tracePointerObstructions = [];
  for (let index = 1; index <= 5; index += 1) {
    const trace = page.getByRole('button', { name: new RegExp(`P1 · L${index}.*show on source page`, 'i') });
    await trace.scrollIntoViewIfNeeded();
    const hit = await trace.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return { clickable: top === element || element.contains(top), topClass: top?.className || top?.tagName || '', scrollY };
    });
    if (!hit.clickable) {
      tracePointerObstructions.push({ line: index, ...hit });
      await trace.evaluate((element) => element.click());
    } else {
      await trace.click();
    }
    assert(await page.locator('.source-highlight').isVisible(), `Trace line ${index} did not highlight a source region`);
    await page.waitForTimeout(350);
  }

  await page.getByRole('button', { name: /Needs review/ }).click();
  const correction = page.getByRole('textbox', { name: 'Recognized text, page 1 line 1' });
  await correction.fill('Each page keeps a checked route to its source.');
  await correction.blur();
  await page.getByText('Queue clear').waitFor();
  assert(await page.getByText('Queue clear').isVisible(), 'Correction did not clear the queue');
  await page.reload();
  assert((await page.locator('textarea').nth(2).inputValue()) === 'Each page keeps a checked route to its source.', 'Correction did not survive reload');

  const exportDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reading pack' }).click();
  const exportPath = await (await exportDownload).path();
  assert(exportPath, 'Reading-pack export has no file');
  const archive = unzipSync(readFileSync(exportPath));
  const archiveNames = Object.keys(archive);
  for (const name of ['reading.md', 'reading.txt', 'reading.html', 'source-map.json', 'source-pages/page-1.webp']) {
    assert(archiveNames.includes(name), `Reading-pack export is missing ${name}`);
  }
  assert(strFromU8(archive['source-map.json']).includes('Each page keeps a checked route to its source.'), 'Source map did not keep corrected text');

  const backupDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up project' }).click();
  const backupPath = await (await backupDownload).path();
  assert(backupPath, 'Backup export has no file');
  const backup = JSON.parse(readFileSync(backupPath, 'utf8'));
  assert(backup.format === 'scan-reading-pack/project-v1', 'Backup format marker is wrong');

  await page.getByRole('button', { name: 'Start for real' }).first().click();
  await page.waitForURL(`${base}/`);
  await page.locator('#restore-input').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  assert((await page.getByRole('alert').innerText()).includes('not a valid Scan Reading Pack backup'), 'Invalid backup error is missing');
  await page.locator('#restore-input').setInputFiles(backupPath);
  await page.locator('#live-status').filter({ hasText: '1 project restored.' }).waitFor();
  assert((await page.locator('#live-status').innerText()).includes('1 project restored.'), 'Valid backup did not recover after invalid input');
  assert(await page.getByRole('alert').count() === 0, 'Stale invalid-backup error remained after recovery');

  await page.locator('#file-input').setInputFiles({ name: 'unsupported.txt', mimeType: 'text/plain', buffer: Buffer.from('not a scan') });
  assert((await page.getByRole('alert').innerText()).includes('could not be opened'), 'Unsupported scan error is missing');
  await page.locator('#file-input').setInputFiles(fixture);
  await page.getByRole('heading', { level: 1, name: 'sample-scan' }).waitFor();
  assert(await page.getByRole('heading', { level: 1, name: 'sample-scan' }).isVisible(), 'Valid scan did not recover after invalid input');
  assert(await page.getByRole('alert').count() === 0, 'Stale invalid-scan error remained after recovery');
  await page.getByRole('button', { name: /Recognize this page/ }).click();
  await page.locator('textarea').first().waitFor({ state: 'visible', timeout: 90_000 });
  assert(/NIGHT|READING/i.test(await page.locator('textarea').first().inputValue()), 'Local OCR produced no expected fixture text');

  await page.getByRole('button', { name: 'Extract a figure' }).click();
  await page.locator('#scan-stage').scrollIntoViewIfNeeded();
  const stage = await page.locator('#scan-stage').boundingBox();
  assert(stage, 'Scan stage missing');
  await page.mouse.move(stage.x + stage.width * 0.3, stage.y + stage.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width * 0.7, stage.y + stage.height * 0.7);
  await page.mouse.up();
  await page.getByText('1 figure saved from this page').waitFor();
  assert(await page.getByText('1 figure saved from this page').isVisible(), 'Figure crop did not save');

  const demoAxe = await new AxeBuilder({ page }).analyze();
  const serious = demoAxe.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''));
  assert(serious.length === 0, `Desktop axe serious/critical: ${serious.map((item) => item.id).join(', ')}`);
  const labelAxe = await new AxeBuilder({ page }).withTags(['experimental']).withRules(['label-content-name-mismatch']).analyze();
  assert(labelAxe.violations.length === 0, 'Visible-label accessible-name mismatch remains');
  await page.screenshot({ path: path.join(out, 'live-desktop-workbench.png'), fullPage: true });

  const externalRuntimeRequests = requests.filter((item) => {
    const url = new URL(item.url);
    return url.protocol !== 'blob:' && url.origin !== base;
  });
  assert(externalRuntimeRequests.length === 0, `Unexpected outbound request: ${JSON.stringify(externalRuntimeRequests)}`);
  assert(requests.every((item) => item.method === 'GET'), 'A runtime request was not GET');
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(' | ')}`);
  assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(' | ')}`);
  evidence.desktop = {
    rootStatus: rootResponse.status(),
    demoDatabases,
    personalDocumentCountInDemo,
    tracePointerObstructions,
    archiveNames,
    ocrText: (await page.locator('textarea').first().inputValue()).slice(0, 160),
    requestCount: requests.length,
    externalRuntimeRequests,
    nonGetRequests: requests.filter((item) => item.method !== 'GET'),
    consoleErrors,
    pageErrors,
    axeSeriousCritical: serious.map((item) => item.id),
    labelNameViolations: labelAxe.violations.map((item) => item.id),
  };
  await context.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile = await mobileContext.newPage();
  const mobileConsoleErrors = [];
  mobile.on('console', (message) => { if (message.type() === 'error') mobileConsoleErrors.push(message.text()); });
  await mobile.goto(base, { waitUntil: 'networkidle' });
  const firstScreen = await mobile.evaluate(() => {
    const names = ['h1', '.lede', '.hero-actions', '.hero-facts'];
    return Object.fromEntries(names.map((selector) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return [selector, box ? { top: box.top, bottom: box.bottom } : null];
    }));
  });
  assert(Object.values(firstScreen).every((box) => box && box.bottom <= 844), `Mandatory first-screen content is below fold: ${JSON.stringify(firstScreen)}`);
  await mobile.getByRole('link', { name: 'Try it with sample data' }).click();
  await mobile.getByRole('heading', { level: 1, name: /Night Reading Room/ }).waitFor();
  const mobileAxe = await new AxeBuilder({ page: mobile }).analyze();
  const mobileSerious = mobileAxe.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''));
  assert(mobileSerious.length === 0, `Mobile axe serious/critical: ${mobileSerious.map((item) => item.id).join(', ')}`);
  const controls = mobile.locator('a:visible, button:visible, label.file-button:visible');
  const targetSizes = [];
  for (let index = 0; index < await controls.count(); index += 1) {
    const box = await controls.nth(index).boundingBox();
    if (box) targetSizes.push({ width: box.width, height: box.height });
  }
  assert(targetSizes.every((box) => box.width >= 44 && box.height >= 44), 'A mobile target is smaller than 44x44');
  const width = await mobile.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert(width.scroll <= width.client, `Mobile workbench overflows: ${JSON.stringify(width)}`);
  await mobile.screenshot({ path: path.join(out, 'live-mobile-demo.png'), fullPage: true });
  evidence.mobile = {
    firstScreen,
    width,
    controlCount: targetSizes.length,
    minimumTarget: targetSizes.reduce((value, box) => ({ width: Math.min(value.width, box.width), height: Math.min(value.height, box.height) }), { width: Infinity, height: Infinity }),
    axeSeriousCritical: mobileSerious.map((item) => item.id),
    consoleErrors: mobileConsoleErrors,
  };
  assert(mobileConsoleErrors.length === 0, `Mobile console errors: ${mobileConsoleErrors.join(' | ')}`);
  await mobileContext.close();

  const motionContext = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const motion = await motionContext.newPage();
  await motion.goto(base);
  await motion.getByRole('link', { name: 'Try it with sample data' }).waitFor();
  const motionStyles = await motion.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    transitionDuration: getComputedStyle(document.querySelector('.primary-button')).transitionDuration,
    animationDuration: getComputedStyle(document.querySelector('.hero-art')).animationDuration,
    heroTransform: getComputedStyle(document.querySelector('.hero-art')).transform,
  }));
  assert(motionStyles.scrollBehavior === 'auto', `Reduced-motion scroll behavior is ${motionStyles.scrollBehavior}`);
  evidence.reducedMotion = motionStyles;
  await motionContext.close();
} finally {
  await browser.close();
}

writeFileSync(path.join(out, 'live-audit.json'), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
