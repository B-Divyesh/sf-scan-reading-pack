import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';

const require = createRequire('/work/scan-reading-pack-review-1-clean/package.json');
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const { unzipSync, strFromU8 } = require('fflate');

const base = 'https://scan-reading-pack.sociobot.in';
const artifactDir = '/work/repo/.factory/qa-artifacts/review-1';
const fixture = '/work/scan-reading-pack-review-1-clean/tests/fixtures/sample-scan.png';
const oversized = '/tmp/scan-reading-pack-review-1-too-large.png';
const unsupported = '/tmp/scan-reading-pack-review-1-unsupported.txt';
writeFileSync(oversized, Buffer.alloc(80 * 1024 * 1024 + 1));
writeFileSync(unsupported, 'This is not an image.');

const result = { checks: [], details: {} };
const check = (condition, name, detail = '') => {
  if (!condition) throw new Error(`${name}${detail ? `: ${detail}` : ''}`);
  result.checks.push(name);
};
const text = async (locator) => (await locator.textContent())?.replace(/\s+/g, ' ').trim() || '';
const boxInside = async (page, selector, height) => {
  const box = await page.locator(selector).boundingBox();
  check(Boolean(box), `${selector} has a layout box`);
  check(box.y >= 0 && box.y + box.height <= height, `${selector} fits before scrolling`, JSON.stringify(box));
  return box;
};
const snapshotDb = async (page, name) => page.evaluate(async (dbName) => {
  const known = (await indexedDB.databases()).find((item) => item.name === dbName);
  if (!known) return null;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onerror = () => reject(request.error);
    request.onsuccess = async () => {
      const db = request.result;
      const stores = [...db.objectStoreNames];
      const output = {};
      for (const storeName of stores) {
        output[storeName] = await new Promise((res, rej) => {
          const tx = db.transaction(storeName, 'readonly');
          const keys = tx.objectStore(storeName).getAllKeys();
          keys.onsuccess = () => res(keys.result.map(String).sort());
          keys.onerror = () => rej(keys.error);
        });
      }
      db.close();
      resolve(output);
    };
  });
}, name);

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requests = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));

  const homeResponse = await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  check(homeResponse?.status() === 200, 'desktop home returns 200');
  check(await page.title() === 'Scan Reading Pack — trace text from scans', 'home title names the job');
  check(await page.locator('h1').count() === 1, 'home has one h1');
  check(await page.locator('main').count() === 1, 'home has main landmark');
  const firstRead = {
    job: await text(page.locator('h1')),
    audience: await text(page.locator('.lede')),
    firstAction: await text(page.getByRole('link', { name: 'Try it with sample data' })),
    actionResult: await text(page.locator('.hero-actions > span')),
    facts: await page.locator('.hero-facts li').allTextContents(),
  };
  check(firstRead.job === 'Make reading packs from scanned pages.', 'first read states the job');
  check(firstRead.audience.includes('readers with scanned books or reports'), 'first read states the audience');
  check(firstRead.firstAction === 'Try it with sample data', 'first read states the first action');
  check(firstRead.facts.length === 3, 'first read shows three plain facts');
  for (const selector of ['h1', '.lede', '.hero-actions', '.hero-facts']) await boxInside(page, selector, 720);
  await page.screenshot({ path: `${artifactDir}/live-desktop-first-read.png`, fullPage: false });
  result.details.desktopFirstRead = firstRead;

  await page.keyboard.press('Tab');
  check(await page.getByRole('link', { name: 'Skip to main content' }).evaluate((el) => el === document.activeElement), 'skip link is first keyboard stop');
  const focusRing = await page.getByRole('link', { name: 'Skip to main content' }).evaluate((el) => {
    const style = getComputedStyle(el);
    return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor };
  });
  check(parseFloat(focusRing.width) >= 3 && focusRing.style !== 'none', 'skip link has designed visible focus');
  await page.keyboard.press('Enter');
  check(await page.locator('main').evaluate((el) => el === document.activeElement), 'skip link moves focus to main');

  const personalBefore = await snapshotDb(page, 'scan-reading-pack');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForLoadState('networkidle');
  check(new URL(page.url()).pathname === '/demo/', 'sample opens in one click');
  check(await page.title() === 'Demo — Scan Reading Pack', 'demo route title is specific');
  check((await text(page.getByLabel('Demo controls'))).includes('Demo — sample data, nothing is saved to your library.'), 'persistent sample label is explicit');
  check((await text(page.locator('h1'))).includes('Night Reading Room'), 'sample is realistically populated');
  check(await page.locator('textarea').count() === 5, 'sample includes five recognized lines');
  check((await text(page.locator('.confidence.low'))).includes('78%'), 'sample includes a low-confidence line');

  await page.setViewportSize({ width: 1440, height: 900 });
  for (let index = 1; index <= 5; index += 1) {
    const trace = page.getByRole('button', { name: new RegExp(`P1 · L${index}.*show on source page`, 'i') });
    await trace.scrollIntoViewIfNeeded();
    const hit = await trace.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return target === el || el.contains(target);
    });
    check(hit, `sample trace line ${index} owns its pointer target`);
    await trace.focus();
    const ring = await trace.evaluate((el) => parseFloat(getComputedStyle(el).outlineWidth));
    check(ring >= 3, `sample trace line ${index} shows focus`);
    await trace.click();
    check((await text(page.locator('.text-block.selected'))).includes(`L${index}`), `sample trace line ${index} selects matching text`);
    check(await page.locator('.source-highlight').isVisible(), `sample trace line ${index} shows source region`);
  }

  const corrected = 'Each corrected page keeps a route back to its source.';
  const correction = page.getByRole('textbox', { name: 'Recognized text, page 1 line 3' });
  await correction.fill(corrected);
  await correction.blur();
  check(await correction.inputValue() === corrected, 'sample correction is editable');
  check((await text(page.getByLabel('Demo controls'))).includes('nothing is saved'), 'sample label persists after editing');

  const packPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reading pack' }).click();
  const pack = await packPromise;
  const packPath = await pack.path();
  check(Boolean(packPath), 'sample reading pack downloads');
  const archive = unzipSync(readFileSync(packPath));
  const archiveNames = Object.keys(archive);
  for (const name of ['README.txt', 'reading.md', 'reading.txt', 'reading.html', 'source-map.json', 'source-pages/page-1.webp']) {
    check(archiveNames.includes(name), `reading pack contains ${name}`);
  }
  const sourceMap = JSON.parse(strFromU8(archive['source-map.json']));
  const correctedMapLine = sourceMap.pages[0].blocks.find((item) => item.id === 'demo-line-3');
  check(correctedMapLine.text === corrected && correctedMapLine.confidence === 78, 'export keeps corrected text and original confidence');
  check(['x0', 'y0', 'x1', 'y1'].every((key) => Number.isFinite(correctedMapLine.box[key])), 'export keeps page coordinates');
  check(strFromU8(archive['reading.txt']).includes(corrected), 'exported plain text contains correction');
  check((await text(page.getByLabel('Demo controls'))).includes('nothing is saved'), 'sample label persists after export');

  const backupPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up project' }).click();
  const backupPath = await (await backupPromise).path();
  check(Boolean(backupPath), 'sample project backup downloads');

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByText('Sample reading pack reset.').waitFor();
  const resetText = await page.getByRole('textbox', { name: 'Recognized text, page 1 line 3' }).inputValue();
  check(resetText === 'Each page kept a route back to the paper from which it came.', 'reset restores original sample');
  check((await text(page.getByLabel('Demo controls'))).includes('nothing is saved'), 'sample label persists after reset');
  const personalAfterDemo = await snapshotDb(page, 'scan-reading-pack');
  check(JSON.stringify(personalAfterDemo) === JSON.stringify(personalBefore), 'demo leaves personal IndexedDB unchanged');
  const dbNames = await page.evaluate(async () => (await indexedDB.databases()).map((item) => item.name));
  check(dbNames.includes('demo:scan-reading-pack'), 'demo uses its own IndexedDB database');

  await page.getByRole('button', { name: 'Start for real' }).first().click();
  await page.waitForURL(`${base}/`);
  const namesAfterLeave = await page.evaluate(async () => (await indexedDB.databases()).map((item) => item.name));
  check(!namesAfterLeave.includes('demo:scan-reading-pack'), 'leaving demo discards demo database');
  check(JSON.stringify(await snapshotDb(page, 'scan-reading-pack')) === JSON.stringify(personalBefore), 'leaving demo preserves personal IndexedDB');

  await page.locator('#restore-input').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await page.getByRole('alert').waitFor();
  check((await text(page.getByRole('alert'))).includes('not a valid Scan Reading Pack backup'), 'invalid backup gives recovery guidance');
  await page.locator('#restore-input').setInputFiles(backupPath);
  await page.getByText('1 project restored.').waitFor();
  await page.getByRole('button', { name: /Night Reading Room/ }).click();
  check((await text(page.locator('h1'))).includes('Night Reading Room'), 'valid backup restores after invalid attempt under live CSP');
  check(await page.getByRole('alert').count() === 0, 'successful backup retry clears stale error');

  await page.getByRole('button', { name: '← Library' }).click();
  await page.locator('#file-input').setInputFiles(oversized);
  check((await text(page.getByRole('alert'))).includes('80 MB or smaller'), 'oversized scan reaches documented boundary');
  await page.locator('#file-input').setInputFiles(unsupported);
  check((await text(page.getByRole('alert'))).includes('could not be opened'), 'unsupported scan gives actionable error');
  await page.locator('#file-input').setInputFiles(fixture);
  await page.getByRole('heading', { level: 1, name: 'sample-scan' }).waitFor();
  check(await page.getByRole('alert').count() === 0, 'valid scan recovers from invalid import');
  await page.getByRole('button', { name: /Recognize this page/ }).click();
  await page.locator('textarea').first().waitFor({ timeout: 90000 });
  const ocrText = await page.locator('textarea').first().inputValue();
  check(/NIGHT|READING/i.test(ocrText), 'live browser OCR recognizes the shipped scan');

  const normalTraffic = requests.map((item) => ({ ...item, origin: new URL(item.url).origin })).filter((item) => !item.url.startsWith('blob:'));
  check(normalTraffic.every((item) => item.origin === base && item.method === 'GET'), 'landing, demo, restore, import, and OCR traffic stays same-origin GET');

  await page.getByRole('button', { name: '← Library' }).click();
  await page.locator('#license-token').fill(`review-invalid-${Date.now()}`);
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.getByRole('alert').waitFor({ timeout: 30000 });
  check((await text(page.getByRole('alert'))).includes('license is invalid'), 'invalid live license is rejected in plain words');
  const lastRequest = requests.at(-1);
  check(lastRequest && new URL(lastRequest.url).origin === 'https://api.sociobot.in', 'license verification contacts only the declared billing API');

  await page.screenshot({ path: `${artifactDir}/live-desktop-demo.png`, fullPage: false });
  result.details.desktop = {
    firstRead,
    focusRing,
    archiveNames,
    correctedMapLine,
    normalRequestCount: normalTraffic.length,
    normalOrigins: [...new Set(normalTraffic.map((item) => item.origin))],
    consoleErrors,
    pageErrors,
  };
  check(consoleErrors.length === 0, 'desktop flow has no console errors', JSON.stringify(consoleErrors));
  check(pageErrors.length === 0, 'desktop flow has no page errors', JSON.stringify(pageErrors));
  await context.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile = await mobileContext.newPage();
  const mobileErrors = [];
  mobile.on('console', (message) => { if (message.type() === 'error') mobileErrors.push(message.text()); });
  await mobile.goto(`${base}/`, { waitUntil: 'networkidle' });
  for (const selector of ['h1', '.lede', '.hero-actions', '.hero-facts']) await boxInside(mobile, selector, 844);
  const mobileFirstRead = {
    job: await text(mobile.locator('h1')),
    audience: await text(mobile.locator('.lede')),
    firstAction: await text(mobile.getByRole('link', { name: 'Try it with sample data' })),
    facts: await mobile.locator('.hero-facts li').allTextContents(),
  };
  await mobile.screenshot({ path: `${artifactDir}/live-phone-first-read.png`, fullPage: false });
  await mobile.getByRole('link', { name: 'Try it with sample data' }).click();
  await mobile.waitForLoadState('networkidle');
  check((await text(mobile.getByLabel('Demo controls'))).includes('nothing is saved'), 'phone demo keeps sample label visible');
  const targets = await mobile.locator('a:visible, button:visible, label.file-button:visible').evaluateAll((elements) => elements.map((el) => {
    const box = el.getBoundingClientRect();
    return { text: (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' '), width: box.width, height: box.height };
  }));
  check(targets.length > 10, 'phone demo exposes the full control set');
  check(targets.every((item) => item.width >= 44 && item.height >= 44), 'phone controls meet 44px touch targets', JSON.stringify(targets.filter((item) => item.width < 44 || item.height < 44)));
  const mobileWidth = await mobile.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  check(mobileWidth.scroll <= mobileWidth.client, 'phone demo has no horizontal overflow');
  await mobile.screenshot({ path: `${artifactDir}/live-phone-demo.png`, fullPage: false });
  await mobile.goto(`${base}/`);
  await mobile.evaluate(() => {
    const rootRule = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]).find((rule) => rule instanceof CSSStyleRule && rule.selectorText === ':root');
    rootRule.style.setProperty('font-size', '200%', 'important');
  });
  await mobile.locator('.pricing-section').scrollIntoViewIfNeeded();
  const zoomWidth = await mobile.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  check(zoomWidth.scroll <= zoomWidth.client, 'phone landing reflows at 200% text');
  check(mobileErrors.length === 0, 'phone flow has no console errors', JSON.stringify(mobileErrors));
  result.details.mobile = { firstRead: mobileFirstRead, targetCount: targets.length, minTarget: Math.min(...targets.flatMap((item) => [item.width, item.height])), mobileWidth, zoomWidth };
  await mobileContext.close();

  const routeContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const routePage = await routeContext.newPage();
  const routeExpectations = [
    ['/', 200, 'Scan Reading Pack — trace text from scans'],
    ['/demo/', 200, 'Demo — Scan Reading Pack'],
    ['/privacy/', 200, 'Privacy — Scan Reading Pack'],
    ['/terms/', 200, 'Terms — Scan Reading Pack'],
    ['/review-1-intentional-not-found', 404, 'Page not found — Scan Reading Pack'],
  ];
  const routeResults = [];
  const internalLinks = new Set();
  for (const [route, expectedStatus, expectedTitle] of routeExpectations) {
    const response = await routePage.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    const status = response?.status();
    check(status === expectedStatus, `${route} returns ${expectedStatus}`, String(status));
    check(await routePage.title() === expectedTitle, `${route} has a route-specific title`, await routePage.title());
    check(await routePage.locator('h1').count() === 1, `${route} has one h1`);
    check(await routePage.locator('main').count() === 1, `${route} has main landmark`);
    check(await routePage.locator('header').count() === 1 && await routePage.locator('footer').count() === 1, `${route} has the standard header and footer`);
    const axe = await new AxeBuilder({ page: routePage }).analyze();
    const serious = axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''));
    check(serious.length === 0, `${route} has no serious or critical Axe findings`, JSON.stringify(serious));
    const labelAxe = await new AxeBuilder({ page: routePage }).withTags(['experimental']).withRules(['label-content-name-mismatch']).analyze();
    check(labelAxe.violations.length === 0, `${route} passes label-in-name`, JSON.stringify(labelAxe.violations));
    for (const href of await routePage.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter((href) => href && !href.startsWith('#')))) {
      const url = new URL(href, base);
      if (url.origin === base) internalLinks.add(`${url.origin}${url.pathname}`);
    }
    routeResults.push({ route, status, title: await routePage.title(), h1: await text(routePage.locator('h1')) });
  }
  for (const url of internalLinks) {
    const response = await routeContext.request.get(url, { maxRedirects: 0 });
    check(response.status() === 200, `internal link resolves: ${new URL(url).pathname}`, String(response.status()));
  }
  const checkout = await routeContext.request.get('https://api.sociobot.in/api/v1/products/scan-reading-pack/checkout', { maxRedirects: 0 });
  check(checkout.status() === 303, 'buy link redirects to hosted checkout', String(checkout.status()));
  result.details.routes = routeResults;
  result.details.internalLinks = [...internalLinks];
  await routeContext.close();

  const mobileA11yContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobileA11yPage = await mobileA11yContext.newPage();
  for (const [route] of routeExpectations) {
    await mobileA11yPage.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    const axe = await new AxeBuilder({ page: mobileA11yPage }).analyze();
    const serious = axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''));
    check(serious.length === 0, `${route} has no serious or critical phone Axe findings`, JSON.stringify(serious));
    const width = await mobileA11yPage.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    check(width.scroll <= width.client, `${route} has no phone horizontal overflow`, JSON.stringify(width));
  }
  await mobileA11yContext.close();

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage();
  await reduced.goto(`${base}/`);
  const motion = await reduced.locator('.primary-button').first().evaluate((el) => {
    const style = getComputedStyle(el);
    return { transitionDuration: style.transitionDuration, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };
  });
  check(motion.transitionDuration === '0s' && motion.scrollBehavior === 'auto', 'reduced motion disables transitions and smooth scrolling', JSON.stringify(motion));
  result.details.reducedMotion = motion;
  await reducedContext.close();

  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const offline = await offlineContext.newPage();
  await offline.goto(`${base}/demo/`, { waitUntil: 'networkidle' });
  await offline.evaluate(() => navigator.serviceWorker.ready);
  await offline.reload({ waitUntil: 'networkidle' });
  check(await offline.evaluate(() => Boolean(navigator.serviceWorker.controller)), 'live service worker controls the app');
  const updateState = await offline.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return { active: registration.active?.state, waiting: registration.waiting?.state || null };
  });
  check(updateState.active === 'activated', 'service worker update check completes', JSON.stringify(updateState));
  await offlineContext.setOffline(true);
  await offline.reload({ waitUntil: 'domcontentloaded' });
  await offline.getByText('You’re offline').waitFor();
  check((await text(offline.locator('h1'))).includes('Night Reading Room'), 'populated demo reloads offline');
  result.details.pwa = updateState;
  await offlineContext.close();

  result.verdict = 'PASS';
  result.checkCount = result.checks.length;
  console.log(`LIVE_REVIEW_RESULT ${JSON.stringify(result)}`);
} finally {
  await browser.close();
}
