import './style.css';
import './repair.css';
import { registerSW } from 'virtual:pwa-register';
import type { Figure, LicenseState, ScanDocument, ScanPage, TextBlock } from './types';
import { deleteDocument, discardDemoDocuments, listDocuments, saveDocument, setDemoMode } from './db';
import { createSampleDocument } from './demo';
import { acceptReturnedLicense, checkoutUrl, getLicenseState, removeLicense, restoreLicense } from './license';
import { recognizePage } from './ocr';
import { downloadBlob, downloadPack, safeName } from './exporter';
import { backupImageFromDataUrl } from './data-url';

const app = document.querySelector<HTMLDivElement>('#app')!;
let documents: ScanDocument[] = [];
let active: ScanDocument | null = null;
let selectedPage = 0;
let selectedBlock: string | null = null;
let reviewOnly = false;
let working = false;
let cropMode = false;
let cropStart: { x: number; y: number } | null = null;
let license: LicenseState = { token: null, valid: false, checkedAt: 0 };
let notice = '';
let error = '';
let demoMode = false;
const imageUrls = new Map<string, string>();

const icon = (name: 'scan' | 'trace' | 'check' | 'audio' | 'arrow' | 'download' | 'lock') => {
  const paths = {
    scan: '<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M8 12h8"/>',
    trace: '<path d="M5 5h5v5H5zM14 14h5v5h-5zM10 8c5 0 1 8 5 8"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    audio: '<path d="M4 10v4h4l5 4V6L8 10H4zM17 9c1 2 1 4 0 6M20 6c3 4 3 8 0 12"/>',
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
    download: '<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/>',
    lock: '<path d="M6 10h12v10H6zM8 10V7a4 4 0 0 1 8 0v3"/>',
  };
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${paths[name]}</svg>`;
};

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function header(back = false): string {
  const howHref = location.pathname === '/' || location.pathname === '/index.html' ? '#how' : '/#how';
  return `<header class="site-header">
    <a class="brand" href="/"><span class="brand-mark">SR</span><span>Scan Reading Pack</span></a>
    <nav aria-label="Primary">
      ${back ? '<button class="text-button" id="back-home">← Library</button>' : `<a href="${howHref}">How it works</a>`}
      <a href="/demo/">Demo</a>
      <a href="/privacy/">Privacy</a>
      <span class="local-badge"><i></i>${navigator.onLine ? 'Local-first' : 'Offline'}</span>
    </nav>
  </header>`;
}

function footer(): string {
  return `<footer><div><strong>Scan Reading Pack</strong><p>Trace text back to the source page before you rely on it.</p></div><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><span>Built by Param Factory · build 1.0.2</span><span>Original generated illustration · © 2026 Sociobot</span></div></footer>`;
}

function statusRegions(): string {
  return `${demoMode ? `<aside class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved to your library.</strong><span>This sample uses its own browser-only workspace.</span><button class="text-button" id="reset-demo">Reset demo</button><button class="demo-real-button" id="start-real">Start for real</button></aside>` : ''}
    ${!navigator.onLine ? '<div class="offline-banner" role="status">You’re offline. Saved projects and cached OCR remain available.</div>' : ''}
    ${working && !active ? '<div class="working-banner" role="status"><span></span> Preparing your source pages locally…</div>' : ''}
    <div class="sr-only" aria-live="polite" id="live-status">${escapeHtml(notice)}</div>
    ${error ? `<div class="error-banner" role="alert"><span>${escapeHtml(error)}</span><button id="dismiss-error" aria-label="Dismiss error">×</button></div>` : ''}`;
}

function landing(): void {
  const docRows = documents.map((doc) => `<li>
    <button class="document-row" data-open="${doc.id}">
      <span class="doc-icon">${icon('trace')}</span>
      <span><strong>${escapeHtml(doc.title)}</strong><small>${doc.pages.length} page${doc.pages.length === 1 ? '' : 's'} · ${doc.pages.filter((p) => p.status === 'done').length} recognized</small></span>
      <span aria-hidden="true">→</span>
    </button>
  </li>`).join('');
  app.innerHTML = `${header()}${statusRegions()}<main id="main" tabindex="-1">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow"><span>01</span> Verifiable OCR workshop</p>
        <h1>Make reading packs from <em>scanned pages.</em></h1>
        <p class="lede">For readers with scanned books or reports who need selectable text linked to its source page.</p>
        <div class="hero-actions">
          <a class="primary-button" href="/demo/">${icon('trace')} Try it with sample data</a>
          <span>Opens a marked one-page reading pack</span>
        </div>
        <div class="import-actions"><label class="text-button file-button" for="file-input">${icon('scan')} Choose your scans</label><span>PDF, PNG, JPEG or WebP</span></div>
        <input class="visually-hidden" id="file-input" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" multiple />
        <ul class="hero-facts"><li>Sample data uses its own workspace.</li><li>Pages stay in this browser.</li><li>Cached OCR works offline.</li></ul>
        <p class="trust-note">${icon('lock')} Only process material you have the right to use.</p>
      </div>
      <figure class="hero-art">
        <picture><source srcset="/assets/hero-workbench.avif" type="image/avif"><source srcset="/assets/hero-workbench.webp" type="image/webp"><img src="/assets/hero-workbench.jpg" width="1200" height="800" alt="A worn book under cyan inspection light, connected by guide threads to a tidy stack of reading slips" fetchpriority="high" decoding="async"></picture>
        <figcaption><span>Source page</span><i></i><span>Reading pack</span></figcaption>
      </figure>
    </section>

    <section class="library-section" aria-labelledby="library-title">
      <div class="section-heading"><div><p class="eyebrow"><span>02</span> Your local library</p><h2 id="library-title">Continue a reading pack</h2></div>${documents.length ? '<button class="secondary-button" id="backup-all">Export project data</button>' : ''}</div>
      ${documents.length ? `<ul class="document-list">${docRows}</ul>` : `<div class="empty-library"><span class="empty-glyph">⌁</span><div><h3>No scans on the bench</h3><p>Choose a scan above. Its pages, recognition, and corrections will reappear here after a refresh.</p></div></div>`}
      <div class="restore-row"><label class="text-button file-button" for="restore-input">Import project backup</label><input class="visually-hidden" id="restore-input" type="file" accept="application/json" /></div>
    </section>

    <section class="steps-section" id="how" aria-labelledby="how-title">
      <p class="eyebrow"><span>03</span> From image to evidence</p><h2 id="how-title">A reading pack, not a text dump</h2>
      <ol class="steps">
        <li><span>01</span>${icon('scan')}<h3>Recognize locally</h3><p>English OCR runs in your browser. The first use caches language files for later offline work.</p></li>
        <li><span>02</span>${icon('trace')}<h3>Follow the trace</h3><p>Select any line to reveal its source page and exact region. Extract figures with a crop gesture.</p></li>
        <li><span>03</span>${icon('check')}<h3>Review uncertainty</h3><p>Low-confidence lines form a short correction queue. Changed lines keep their original confidence.</p></li>
        <li><span>04</span>${icon('audio')}<h3>Pack for reading</h3><p>Export Markdown, HTML, figures, coordinates, plain text, and optional SSML in one ZIP.</p></li>
      </ol>
    </section>

    ${pricingSection()}
  </main>${footer()}`;
  bindGlobal();
  document.querySelector<HTMLInputElement>('#file-input')?.addEventListener('change', importFiles);
  document.querySelector<HTMLInputElement>('#restore-input')?.addEventListener('change', restoreBackup);
  document.querySelector('#backup-all')?.addEventListener('click', backupProjects);
  document.querySelectorAll<HTMLElement>('[data-open]').forEach((button) => button.addEventListener('click', () => openDocument(button.dataset.open!)));
  bindLicenseControls();
}

function pricingSection(): string {
  if (demoMode) return `<section class="pricing-section" aria-labelledby="demo-next-title"><div><p class="eyebrow"><span>04</span> Demo workspace</p><h2 id="demo-next-title">Try the trace, then start your own pack.</h2><p>This demo contains one preloaded page. Start for real to import scans into your personal browser library.</p></div><div class="license-panel"><p class="license-active">${icon('check')} Sample pack ready</p><p>Demo projects are separate from your library and are discarded when you leave.</p><button class="primary-button" id="start-real-panel">Start for real</button></div></section>`;
  return `<section class="pricing-section" aria-labelledby="unlock-title">
    <div><p class="eyebrow"><span>04</span> Desktop-quality unlock</p><h2 id="unlock-title">Free for a chapter. One-time for the shelf.</h2><p>Every project can be corrected, backed up, and exported. A one-time <strong>$19 USD</strong> license adds unlimited-page OCR and audiobook SSML export on your devices.</p></div>
    <div class="license-panel">
      ${license.valid ? `<p class="license-active">${icon('check')} Full pack unlocked</p><p>Your cached license is active. It is quietly rechecked at most once a day.</p><button class="text-button" id="remove-license">Remove license from this device</button>` : `<a class="primary-button" href="${checkoutUrl}">${icon('arrow')} Buy the $19 lifetime unlock</a><p class="merchant-copy">One-time purchase. Sociobot/Dodo is merchant of record; refunds are handled there.</p><form id="license-form"><label for="license-token">Already bought it? Paste your license</label><div><input id="license-token" autocomplete="off" required placeholder="License token"><button class="secondary-button" type="submit">Verify</button></div></form>`}
      <p class="legal-mini"><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
    </div>
  </section>`;
}

function bindLicenseControls(): void {
  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = document.querySelector<HTMLInputElement>('#license-token')!;
    if (!input.value.trim()) return;
    restoreLicense(input.value);
    notice = 'Checking your license…';
    license = await getLicenseState(true);
    if (!license.valid) error = license.reason ? `That license is ${license.reason.replaceAll('_', ' ')}.` : 'The license could not be verified. Check the token and your connection.';
    else notice = 'Full pack unlocked on this device.';
    render();
  });
  document.querySelector('#remove-license')?.addEventListener('click', () => {
    removeLicense();
    license = { token: null, valid: false, checkedAt: 0 };
    notice = 'License removed from this device.';
    render();
  });
}

function workbench(): void {
  if (!active) return landing();
  const page = active.pages[selectedPage];
  if (!page) selectedPage = 0;
  const current = active.pages[selectedPage];
  const lowCount = active.pages.flatMap((item) => item.blocks).filter((block) => block.confidence < 82 && !block.reviewed).length;
  const recognizedCount = active.pages.filter((item) => item.status === 'done').length;
  const visibleBlocks = current.blocks.filter((block) => !reviewOnly || (block.confidence < 82 && !block.reviewed));
  const pageUrl = imageUrl(current);
  const blockMarkup = visibleBlocks.length ? visibleBlocks.map((block, index) => blockEditor(block, index, current.number)).join('') : emptyPageState(current);
  const highlight = selectedBlock ? current.blocks.find((block) => block.id === selectedBlock) : null;

  app.innerHTML = `${header(true)}${statusRegions()}<main id="main" class="workbench-main" tabindex="-1">
    <section class="project-head">
      <div><p class="eyebrow"><span>PACK</span> ${active.pages.length} source page${active.pages.length === 1 ? '' : 's'}</p><h1>${escapeHtml(active.title)}</h1><p>${recognizedCount}/${active.pages.length} pages recognized · ${lowCount} line${lowCount === 1 ? '' : 's'} need review</p></div>
      <div class="project-actions"><button class="secondary-button" id="rename-doc">Rename</button><button class="primary-button" id="export-pack" ${recognizedCount ? '' : 'disabled'}>${icon('download')} Export reading pack</button></div>
    </section>
    <ol class="progress-rail" aria-label="Reading pack workflow">
      <li class="done"><span>1</span>Import</li><li class="${recognizedCount ? 'done' : 'current'}"><span>2</span>Recognize</li><li class="${lowCount ? 'current' : recognizedCount ? 'done' : ''}"><span>3</span>Review</li><li><span>4</span>Export</li>
    </ol>
    <section class="workbench-grid" aria-label="Source and recognized text">
      <div class="source-panel">
        <div class="panel-head"><div><p class="panel-kicker">Source</p><h2>Page ${current.number}</h2></div><div class="page-nav"><button id="prev-page" aria-label="Previous page" ${selectedPage === 0 ? 'disabled' : ''}>←</button><span>${selectedPage + 1} / ${active.pages.length}</span><button id="next-page" aria-label="Next page" ${selectedPage === active.pages.length - 1 ? 'disabled' : ''}>→</button></div></div>
        <div class="scan-stage ${cropMode ? 'crop-mode' : ''}" id="scan-stage">
          <img src="${pageUrl}" width="${current.width}" height="${current.height}" alt="Original scan, page ${current.number}" draggable="false">
          ${highlight ? '<span class="source-highlight" aria-hidden="true"></span>' : ''}
          <span id="crop-preview" aria-hidden="true"></span>
        </div>
        <div class="source-tools"><button class="secondary-button" id="extract-figure">${cropMode ? 'Cancel figure crop' : 'Extract a figure'}</button><span>${cropMode ? 'Drag across the image to crop a figure.' : `${current.figures.length} figure${current.figures.length === 1 ? '' : 's'} saved from this page`}</span></div>
      </div>
      <div class="text-panel">
        <div class="panel-head"><div><p class="panel-kicker">Selectable text</p><h2>${reviewOnly ? 'Confidence queue' : `Page ${current.number} transcript`}</h2></div><button class="queue-toggle ${reviewOnly ? 'active' : ''}" id="review-toggle" aria-pressed="${reviewOnly}"><span>${lowCount}</span> Needs review</button></div>
        ${current.status === 'recognizing' ? `<div class="recognizing-state"><span class="recognition-bars" aria-hidden="true"></span><h3>Reading page ${current.number} locally…</h3><p id="recognition-status">Preparing OCR</p></div>` : `<div class="blocks" id="blocks">${blockMarkup}</div>`}
      </div>
    </section>
    <section class="project-foot">
      <div><strong>Project ownership</strong><p>Back up the page map, source images, text, corrections, and figure crops as JSON.</p></div>
      <div><button class="secondary-button" id="backup-project">Back up project</button><button class="danger-button" id="delete-project">Delete project</button></div>
    </section>
  </main>${footer()}`;
  bindGlobal();
  bindWorkbench(current);
}

function blockEditor(block: TextBlock, index: number, pageNumber: number): string {
  const isLow = block.confidence < 82;
  return `<article class="text-block ${block.id === selectedBlock ? 'selected' : ''} ${isLow && !block.reviewed ? 'uncertain' : ''}" data-block="${block.id}">
    <div class="block-meta"><button class="trace-button" data-trace="${block.id}" aria-label="P${pageNumber} · L${index + 1} — show on source page">P${pageNumber} · L${index + 1}</button><span class="confidence ${isLow ? 'low' : ''}">${isLow ? 'Check' : 'Clear'} · ${block.confidence}%</span></div>
    <label class="sr-only" for="block-${block.id}">Recognized text, page ${pageNumber} line ${index + 1}</label>
    <textarea id="block-${block.id}" data-edit="${block.id}" rows="${Math.max(2, Math.ceil(block.text.length / 62))}">${escapeHtml(block.text)}</textarea>
    <div class="block-actions"><button class="text-button" data-trace="${block.id}">${icon('trace')} Show on scan</button>${isLow && !block.reviewed ? `<button class="text-button check-button" data-check="${block.id}">${icon('check')} Mark checked</button>` : '<span class="checked-label">✓ Checked</span>'}</div>
  </article>`;
}

function emptyPageState(page: ScanPage): string {
  if (reviewOnly) return '<div class="empty-panel"><span>✓</span><h3>Queue clear</h3><p>No low-confidence lines remain on this page.</p></div>';
  if (page.status === 'error') return `<div class="empty-panel error-state"><span>!</span><h3>This page was not recognized</h3><p>Try again. High-resolution or unusually rotated scans may need preprocessing.</p><button class="primary-button" id="recognize-page">Try this page again</button></div>`;
  return `<div class="empty-panel"><span>⌁</span><h3>Ready for local recognition</h3><p>The first run downloads the English OCR model (about 11 MB) and caches it for offline use.</p><button class="primary-button" id="recognize-page">${icon('scan')} Recognize this page</button>${active && active.pages.length > 1 ? '<button class="secondary-button" id="recognize-all">Recognize available pages</button>' : ''}</div>`;
}

function bindWorkbench(page: ScanPage): void {
  document.querySelector('#back-home')?.addEventListener('click', () => { active = null; revokeImages(); render(); });
  document.querySelector('#prev-page')?.addEventListener('click', () => { selectedPage--; selectedBlock = null; render(); });
  document.querySelector('#next-page')?.addEventListener('click', () => { selectedPage++; selectedBlock = null; render(); });
  document.querySelector('#review-toggle')?.addEventListener('click', () => { reviewOnly = !reviewOnly; render(); });
  document.querySelector('#recognize-page')?.addEventListener('click', () => runRecognition([page]));
  document.querySelector('#recognize-all')?.addEventListener('click', () => runRecognition(active!.pages.filter((item) => item.status !== 'done')));
  document.querySelector('#export-pack')?.addEventListener('click', exportProject);
  document.querySelector('#backup-project')?.addEventListener('click', backupProjects);
  document.querySelector('#delete-project')?.addEventListener('click', removeProject);
  document.querySelector('#rename-doc')?.addEventListener('click', renameProject);
  document.querySelector('#extract-figure')?.addEventListener('click', () => { cropMode = !cropMode; cropStart = null; render(); });
  document.querySelectorAll<HTMLElement>('[data-trace]').forEach((button) => button.addEventListener('click', () => { selectedBlock = button.dataset.trace!; render(); requestAnimationFrame(() => document.querySelector('.source-highlight')?.scrollIntoView({ block: 'center', behavior: 'smooth' })); }));
  document.querySelectorAll<HTMLElement>('[data-check]').forEach((button) => button.addEventListener('click', async () => {
    const block = page.blocks.find((item) => item.id === button.dataset.check);
    if (block) { block.reviewed = true; await saveDocument(active!); notice = 'Line marked as checked.'; render(); }
  }));
  document.querySelectorAll<HTMLTextAreaElement>('[data-edit]').forEach((field) => field.addEventListener('change', async () => {
    const block = page.blocks.find((item) => item.id === field.dataset.edit);
    if (block) { block.text = field.value.trim(); block.reviewed = true; await saveDocument(active!); notice = 'Correction saved locally.'; render(); }
  }));
  const stage = document.querySelector<HTMLElement>('#scan-stage');
  if (stage) {
    positionHighlight(stage, page);
    if (cropMode) bindCrop(stage, page);
  }
}

function positionHighlight(stage: HTMLElement, page: ScanPage): void {
  const highlight = document.querySelector<HTMLElement>('.source-highlight');
  const block = page.blocks.find((item) => item.id === selectedBlock);
  const image = stage.querySelector('img');
  if (!highlight || !block || !image) return;
  const update = () => {
    const stageRect = stage.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    highlight.style.left = `${imageRect.left - stageRect.left + block.box.x0 / page.width * imageRect.width}px`;
    highlight.style.top = `${imageRect.top - stageRect.top + block.box.y0 / page.height * imageRect.height}px`;
    highlight.style.width = `${(block.box.x1 - block.box.x0) / page.width * imageRect.width}px`;
    highlight.style.height = `${(block.box.y1 - block.box.y0) / page.height * imageRect.height}px`;
  };
  image.addEventListener('load', update, { once: true });
  requestAnimationFrame(update);
  const observer = new ResizeObserver(() => stage.isConnected ? update() : observer.disconnect());
  observer.observe(stage);
}

async function runRecognition(pages: ScanPage[]): Promise<void> {
  if (!active || working) return;
  const alreadyDone = active.pages.filter((page) => page.status === 'done').length;
  const allowance = license.valid ? pages.length : Math.max(0, 5 - alreadyDone);
  if (!allowance) {
    error = 'The free edition recognizes up to 5 pages per project. The one-time unlock removes that limit.';
    render(); return;
  }
  const queue = pages.slice(0, allowance);
  working = true;
  for (const page of queue) {
    selectedPage = active.pages.indexOf(page);
    page.status = 'recognizing';
    render();
    try {
      page.blocks = await recognizePage(page, (progress) => {
        const target = document.querySelector('#recognition-status');
        if (target) target.textContent = `${progress.status.replaceAll('_', ' ')} · ${Math.round(progress.progress * 100)}%`;
      });
      page.status = 'done';
      await saveDocument(active);
    } catch (reason) {
      console.error(reason);
      page.status = 'error';
      error = `Page ${page.number} could not be recognized. Check available storage and try again.`;
      await saveDocument(active);
      break;
    }
  }
  working = false;
  notice = `Recognition finished for ${queue.filter((page) => page.status === 'done').length} page${queue.length === 1 ? '' : 's'}.`;
  render();
}

async function importFiles(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files || [])];
  if (!files.length || working) return;
  if (files.some((file) => file.size > 80 * 1024 * 1024)) { error = 'Each source file must be 80 MB or smaller for reliable browser storage.'; render(); return; }
  const pdfs = files.filter((file) => file.type === 'application/pdf');
  if (pdfs.length && files.length > 1) { error = 'Import one PDF at a time, or choose a set of image pages.'; render(); return; }
  // A valid new import is an explicit recovery from any earlier import error.
  // Keeping a stale alert would misrepresent the current workbench state.
  error = '';
  working = true;
  notice = 'Preparing source pages locally…';
  render();
  try {
    const pages = pdfs.length ? await pagesFromPdf(pdfs[0]) : await pagesFromImages(files);
    const sourceName = files.length === 1 ? files[0].name : `${files[0].name} + ${files.length - 1} more`;
    const title = files[0].name.replace(/\.[^.]+$/, '') || 'Untitled scan';
    active = { id: crypto.randomUUID(), title, sourceName, createdAt: Date.now(), updatedAt: Date.now(), pages };
    await saveDocument(active);
    documents = await listDocuments();
    selectedPage = 0;
    error = '';
    notice = `${pages.length} source page${pages.length === 1 ? '' : 's'} ready.`;
  } catch (reason) {
    error = 'Those files could not be opened. Use an unencrypted PDF, PNG, JPEG, or WebP scan.';
    active = null;
  }
  working = false;
  render();
}

async function pagesFromPdf(file: File): Promise<ScanPage[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  if (pdf.numPages > 200) throw new Error('Page limit exceeded');
  const pages: ScanPage[] = [];
  for (let index = 1; index <= pdf.numPages; index++) {
    const source = await pdf.getPage(index);
    const base = source.getViewport({ scale: 1 });
    const scale = Math.min(2, 2200 / base.width);
    const viewport = source.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
    await source.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    pages.push(newPage(index, canvas.width, canvas.height, await canvasBlob(canvas)));
    notice = `Preparing source page ${index} of ${pdf.numPages}…`;
  }
  return pages;
}

async function pagesFromImages(files: File[]): Promise<ScanPage[]> {
  const pages: ScanPage[] = [];
  for (const [index, file] of files.entries()) {
    if (!file.type.startsWith('image/')) throw new Error('Unsupported image');
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    pages.push(newPage(index + 1, canvas.width, canvas.height, await canvasBlob(canvas)));
  }
  return pages;
}

function newPage(number: number, width: number, height: number, image: Blob): ScanPage {
  return { id: crypto.randomUUID(), number, width, height, image, blocks: [], figures: [], status: 'ready' };
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Canvas export failed')), 'image/webp', 0.9));
}

function bindCrop(stage: HTMLElement, page: ScanPage): void {
  const image = stage.querySelector('img')!;
  const point = (event: PointerEvent) => {
    const imageRect = image.getBoundingClientRect();
    return { x: Math.max(0, Math.min(imageRect.width, event.clientX - imageRect.left)), y: Math.max(0, Math.min(imageRect.height, event.clientY - imageRect.top)) };
  };
  const move = (event: PointerEvent) => {
    if (!cropStart) return;
    const end = point(event); const preview = document.querySelector<HTMLElement>('#crop-preview')!;
    const stageRect = stage.getBoundingClientRect(); const imageRect = image.getBoundingClientRect();
    preview.style.cssText = `display:block;left:${imageRect.left - stageRect.left + Math.min(cropStart.x, end.x)}px;top:${imageRect.top - stageRect.top + Math.min(cropStart.y, end.y)}px;width:${Math.abs(end.x - cropStart.x)}px;height:${Math.abs(end.y - cropStart.y)}px`;
  };
  const finish = async (event: PointerEvent) => {
    if (!cropStart) return;
    window.removeEventListener('pointermove', move);
    const end = point(event); const imageRect = image.getBoundingClientRect();
    const box = { x0: Math.min(cropStart.x, end.x) / imageRect.width * page.width, y0: Math.min(cropStart.y, end.y) / imageRect.height * page.height, x1: Math.max(cropStart.x, end.x) / imageRect.width * page.width, y1: Math.max(cropStart.y, end.y) / imageRect.height * page.height };
    cropStart = null;
    if (box.x1 - box.x0 < 30 || box.y1 - box.y0 < 30) { error = 'Drag a larger region to extract a figure.'; render(); return; }
    try {
      await addFigure(page, box); cropMode = false; notice = `Figure extracted from page ${page.number}.`; render();
    } catch (reason) {
      console.error(reason); error = 'That figure could not be extracted. Try a smaller region.'; render();
    }
  };
  stage.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    cropStart = point(event);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish, { once: true });
  });
}

async function addFigure(page: ScanPage, box: Figure['box']): Promise<void> {
  const bitmap = await createImageBitmap(page.image, Math.round(box.x0), Math.round(box.y0), Math.round(box.x1 - box.x0), Math.round(box.y1 - box.y0));
  const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0); bitmap.close();
  const count = page.figures.length + 1;
  page.figures.push({ id: crypto.randomUUID(), name: `page-${page.number}-figure-${count}.webp`, blob: await canvasBlob(canvas), box, alt: `Figure ${count} from source page ${page.number}` });
  await saveDocument(active!);
}

async function exportProject(): Promise<void> {
  if (!active) return;
  if (!license.valid) notice = 'Exporting the free pack without SSML. All text, figures, HTML, Markdown, and coordinates are included.';
  await downloadPack(active, license.valid);
  document.querySelector('#live-status')!.textContent = 'Reading pack downloaded.';
}

async function renameProject(): Promise<void> {
  if (!active) return;
  const name = prompt('Name this reading pack', active.title)?.trim();
  if (!name) return;
  active.title = name; await saveDocument(active); documents = await listDocuments(); render();
}

async function removeProject(): Promise<void> {
  if (!active) return;
  if (!confirm(`Delete “${active.title}” and its stored source pages from this device? This cannot be undone.`)) return;
  await deleteDocument(active.id); revokeImages(); active = null; documents = await listDocuments(); notice = 'Project deleted from this device.'; render();
}

async function backupProjects(): Promise<void> {
  const selection = active ? [active] : documents;
  const encoded = await Promise.all(selection.map(async (doc) => ({ ...doc, pages: await Promise.all(doc.pages.map(async (page) => ({ ...page, image: await blobToDataUrl(page.image), figures: await Promise.all(page.figures.map(async (figure) => ({ ...figure, blob: await blobToDataUrl(figure.blob) }))) }))) })));
  downloadBlob(new Blob([JSON.stringify({ format: 'scan-reading-pack/project-v1', documents: encoded })], { type: 'application/json' }), `${active ? safeName(active.title) : 'scan-reading-pack'}-backup.json`);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
}

async function restoreBackup(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text()) as { format: string; documents: Array<Omit<ScanDocument, 'pages'> & { pages: Array<Omit<ScanPage, 'image' | 'figures'> & { image: string; figures: Array<Omit<Figure, 'blob'> & { blob: string }> }> }> };
    if (data.format !== 'scan-reading-pack/project-v1' || !Array.isArray(data.documents)) throw new Error('Invalid backup');
    const restoredDocuments = data.documents.map((doc) => ({ ...doc, pages: doc.pages.map((page) => ({ ...page, image: backupImageFromDataUrl(page.image), figures: page.figures.map((figure) => ({ ...figure, blob: backupImageFromDataUrl(figure.blob) })) })) })) as ScanDocument[];
    for (const restored of restoredDocuments) await saveDocument(restored);
    documents = await listDocuments(); error = ''; notice = `${data.documents.length} project${data.documents.length === 1 ? '' : 's'} restored.`; render();
  } catch { error = 'That file is not a valid Scan Reading Pack backup.'; render(); }
}

function openDocument(id: string): void {
  active = documents.find((doc) => doc.id === id) || null; selectedPage = 0; selectedBlock = null; reviewOnly = false; render();
}

function imageUrl(page: ScanPage): string {
  const existing = imageUrls.get(page.id); if (existing) return existing;
  const url = URL.createObjectURL(page.image); imageUrls.set(page.id, url); return url;
}

function revokeImages(): void { imageUrls.forEach((url) => URL.revokeObjectURL(url)); imageUrls.clear(); }

function bindGlobal(): void {
  document.querySelector('#dismiss-error')?.addEventListener('click', () => { error = ''; render(); });
  document.querySelector('#reset-demo')?.addEventListener('click', () => resetDemo());
  document.querySelector('#start-real')?.addEventListener('click', () => leaveDemo());
  document.querySelector('#start-real-panel')?.addEventListener('click', () => leaveDemo());
}

async function resetDemo(): Promise<void> {
  if (!demoMode) return;
  revokeImages();
  await discardDemoDocuments();
  active = createSampleDocument();
  await saveDocument(active);
  documents = await listDocuments();
  selectedPage = 0;
  selectedBlock = null;
  reviewOnly = false;
  cropMode = false;
  notice = 'Sample reading pack reset.';
  render();
}

async function leaveDemo(): Promise<void> {
  if (!demoMode) return;
  revokeImages();
  await discardDemoDocuments();
  location.assign('/');
}

function legalPage(kind: 'privacy' | 'terms'): void {
  const isPrivacy = kind === 'privacy';
  app.innerHTML = `${header()}<main id="main" class="legal-page" tabindex="-1"><p class="eyebrow"><span>LEGAL</span> Effective 28 August 2026</p><h1>${isPrivacy ? 'Privacy, in plain language.' : 'Fair terms for a local tool.'}</h1>
    ${isPrivacy ? `<p class="legal-lede">Scan Reading Pack is designed so your books, reports, OCR text, corrections, and figure crops do not need to leave your device.</p>
    <h2>What is stored</h2><p>Imported page images, recognized text, page coordinates, figure crops, and edits are stored in your browser’s IndexedDB. A license token and a once-daily verification result are stored in localStorage. You can delete projects individually, clear site data in your browser, or export a project backup at any time.</p>
    <h2>What is sent</h2><p>OCR runs locally. We do not upload source files or extracted text. If you buy or verify a license, your browser contacts the Sociobot billing API with the license token. Checkout details are handled by Sociobot/Dodo as merchant of record under their policies.</p>
    <h2>Analytics and third parties</h2><p>This app contains no behavioral analytics, advertising trackers, third-party fonts, or runtime CDN scripts. The hosted service may retain ordinary security logs such as an IP address and request time for a limited period.</p>
    <h2>Your choices</h2><p>Use the project delete control to remove a project, remove a license in the unlock panel, or clear this site’s storage in browser settings. Project backup files are yours to keep and protect.</p>` : `<p class="legal-lede">Use the tool for scans you are allowed to process. The software assists review; it does not certify a transcription.</p>
    <h2>Acceptable use</h2><p>You must have the right to copy or transform the material you import. Do not use Scan Reading Pack to remove DRM, infringe copyright, or process unlawful material.</p>
    <h2>Accuracy and responsibility</h2><p>OCR can omit, invent, or confuse characters, especially in damaged pages, unusual type, tables, mathematics, and handwriting. Page anchors and confidence labels are aids, not guarantees. Verify important quotations and accessibility-critical output against the original scan.</p>
    <h2>License and payment</h2><p>The free edition recognizes up to five pages per project and includes correction, backup, and core reading-pack export. The $19 USD one-time unlock adds unlimited-page OCR and SSML export. Sociobot/Dodo is merchant of record. Approved refunds revoke the associated license automatically.</p>
    <h2>Warranty and liability</h2><p>The service is provided “as is” without warranties to the extent permitted by law. We are not liable for lost source material, missed OCR errors, or use that violates third-party rights. Keep your original scans and project backups.</p>`}
    <p class="legal-contact">Questions: <a href="mailto:support@sociobot.in">support@sociobot.in</a></p><a class="primary-button" href="/">Return to the workbench</a>
  </main>${footer()}`;
}

function notFoundPage(): void {
  app.innerHTML = `${header()}<main id="main" class="legal-page" tabindex="-1"><p class="eyebrow"><span>404</span> Page not found</p><h1>This page is not on the workbench.</h1><p class="legal-lede">Use the library to make or open a reading pack.</p><a class="primary-button" href="/">Return to the library</a></main>${footer()}`;
}

function render(): void {
  if (location.pathname.startsWith('/privacy')) { document.title = 'Privacy — Scan Reading Pack'; legalPage('privacy'); }
  else if (location.pathname.startsWith('/terms')) { document.title = 'Terms — Scan Reading Pack'; legalPage('terms'); }
  else if (location.pathname === '/' || location.pathname === '/index.html' || location.pathname.startsWith('/demo')) {
    document.title = demoMode ? 'Demo — Scan Reading Pack' : 'Scan Reading Pack — trace text from scans';
    if (active) workbench(); else landing();
  }
  else { document.title = 'Page not found — Scan Reading Pack'; notFoundPage(); }
  document.querySelector('.skip-link')?.addEventListener('click', () => requestAnimationFrame(() => document.querySelector<HTMLElement>('#main')?.focus()));
}

async function start(): Promise<void> {
  const url = new URL(location.href);
  demoMode = location.pathname.startsWith('/demo') || url.searchParams.get('demo') === '1';
  setDemoMode(demoMode);
  if (!demoMode) acceptReturnedLicense();
  documents = await listDocuments();
  if (demoMode && !documents.length) {
    active = createSampleDocument();
    await saveDocument(active);
    documents = await listDocuments();
  }
  if (demoMode) active = documents[0] || null;
  if (!demoMode) license = await getLicenseState();
  render();
  window.addEventListener('online', render); window.addEventListener('offline', render);
  const updateSW = registerSW({
    onNeedRefresh() {
      const toast = document.createElement('div'); toast.className = 'update-toast'; toast.innerHTML = '<span>A new workbench version is ready.</span><button>Update now</button>';
      toast.querySelector('button')!.addEventListener('click', () => updateSW(true)); document.body.append(toast);
    },
    onOfflineReady() {
      // Do not let delayed service-worker readiness overwrite the result of a
      // user action such as importing or restoring a project.
      if (!notice) {
        notice = 'App shell cached. You can reopen it offline.';
        const region = document.querySelector('#live-status');
        if (region) region.textContent = notice;
      }
    },
  });
}

start().catch((reason) => { console.error(reason); app.innerHTML = `<main id="main" class="fatal-state" tabindex="-1"><h1>Scan Reading Pack</h1><p>The local workspace could not start. Reload the page or clear this site’s storage.</p><button id="reload-app">Reload</button></main>`; document.querySelector('#reload-app')?.addEventListener('click', () => location.reload()); });
