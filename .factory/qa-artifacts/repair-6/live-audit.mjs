import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';

const base = 'https://scan-reading-pack.sociobot.in';
const evidence = {};
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch({ headless: true });

try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await desktop.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${base}/?repair=ba26160`, { waitUntil: 'networkidle' });
  const firstRead = await page.evaluate(() => Object.fromEntries(
    ['h1', '.lede', '.hero-actions', '.hero-facts'].map((selector) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return [selector, box && { top: box.top, bottom: box.bottom }];
    }),
  ));
  assert(Object.values(firstRead).every((box) => box && box.top >= 0 && box.bottom <= 720), `first-read overflow: ${JSON.stringify(firstRead)}`);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/demo/`, { waitUntil: 'networkidle' });
  const traceControls = [];
  for (let index = 1; index <= 5; index += 1) {
    const trace = page.getByRole('button', { name: new RegExp(`P1 · L${index}.*show on source page`, 'i') });
    await trace.scrollIntoViewIfNeeded();
    await trace.focus();
    const result = await trace.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const style = getComputedStyle(element);
      return {
        line: element.textContent.trim(),
        pointerHit: hit === element || element.contains(hit),
        focused: document.activeElement === element,
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
      };
    });
    assert(result.pointerHit && result.focused && parseFloat(result.outlineWidth) >= 3 && result.outlineStyle !== 'none', `trace ${index} failed: ${JSON.stringify(result)}`);
    await trace.click();
    traceControls.push(result);
  }
  const normalRouteErrors = [...errors];
  assert(normalRouteErrors.length === 0, `desktop console errors: ${normalRouteErrors.join(' | ')}`);
  const axeDesktop = {};
  for (const route of ['/', '/demo/', '/privacy/', '/terms/', '/not-a-real-page']) {
    await page.goto(`${base}${route}`);
    const result = await new AxeBuilder({ page }).analyze();
    axeDesktop[route] = result.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')).map((item) => item.id);
    assert(axeDesktop[route].length === 0, `desktop Axe ${route}: ${axeDesktop[route].join(', ')}`);
  }
  evidence.desktop = { firstRead, traceControls, axeSeriousCritical: axeDesktop, normalRouteConsoleErrors: normalRouteErrors, expected404NavigationErrors: errors.slice(normalRouteErrors.length) };
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${base}/`, { waitUntil: 'networkidle' });
  const mobileFirstRead = await mobilePage.evaluate(() => Object.fromEntries(
    ['h1', '.lede', '.hero-actions', '.hero-facts'].map((selector) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return [selector, box && { top: box.top, bottom: box.bottom }];
    }),
  ));
  assert(Object.values(mobileFirstRead).every((box) => box && box.bottom <= 844), `mobile first-read overflow: ${JSON.stringify(mobileFirstRead)}`);
  await mobilePage.goto(`${base}/demo/`);
  const controls = mobilePage.locator('a:visible, button:visible, label.file-button:visible');
  const targetSizes = [];
  for (let index = 0; index < await controls.count(); index += 1) {
    const box = await controls.nth(index).boundingBox();
    if (box) targetSizes.push({ width: box.width, height: box.height });
  }
  assert(targetSizes.every((box) => box.width >= 44 && box.height >= 44), 'mobile touch target below 44px');
  const mobileAxe = await new AxeBuilder({ page: mobilePage }).analyze();
  const mobileSerious = mobileAxe.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')).map((item) => item.id);
  assert(mobileSerious.length === 0, `mobile Axe: ${mobileSerious.join(', ')}`);
  evidence.mobile = { firstRead: mobileFirstRead, controlCount: targetSizes.length, minimumTarget: targetSizes.reduce((min, box) => ({ width: Math.min(min.width, box.width), height: Math.min(min.height, box.height) }), { width: Infinity, height: Infinity }), axeSeriousCritical: mobileSerious };
  await mobile.close();

  const offline = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const offlinePage = await offline.newPage();
  await offlinePage.goto(`${base}/`);
  await offlinePage.evaluate(() => navigator.serviceWorker.ready);
  await offlinePage.reload({ waitUntil: 'domcontentloaded' });
  const controlled = await offlinePage.evaluate(() => Boolean(navigator.serviceWorker.controller));
  assert(controlled, 'live page is not service-worker controlled');
  await offline.setOffline(true);
  await offlinePage.reload();
  assert(await offlinePage.getByRole('heading', { level: 1, name: /Make reading packs/ }).isVisible(), 'offline shell did not reload');
  await offline.setOffline(false);
  await offlinePage.evaluate(async () => { const registration = await navigator.serviceWorker.ready; await registration.update(); });
  evidence.pwa = { controlled, updateCheckCompleted: true, offlineShellReloaded: true };
  await offline.close();

  const rootResponse = await fetch(`${base}/?policy-audit=ba26160`);
  const missingResponse = await fetch(`${base}/not-a-real-page`);
  evidence.responsePolicy = {
    rootStatus: rootResponse.status,
    missingStatus: missingResponse.status,
    csp: rootResponse.headers.get('content-security-policy'),
    hsts: rootResponse.headers.get('strict-transport-security'),
    contentTypeOptions: rootResponse.headers.get('x-content-type-options'),
    frameOptions: rootResponse.headers.get('x-frame-options'),
    referrerPolicy: rootResponse.headers.get('referrer-policy'),
    permissionsPolicy: rootResponse.headers.get('permissions-policy'),
  };
  assert(rootResponse.status === 200 && missingResponse.status === 404, 'live response status policy failed');
  assert(evidence.responsePolicy.csp && evidence.responsePolicy.hsts && evidence.responsePolicy.contentTypeOptions === 'nosniff', 'live security headers missing');
} finally {
  await browser.close();
}

writeFileSync('.factory/qa-artifacts/repair-6/live-audit.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
