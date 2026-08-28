import { zipSync, strToU8 } from 'fflate';
import type { Figure, ScanDocument, ScanPage } from './types';

export function safeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'reading-pack';
}

function pageMarkdown(page: ScanPage): string {
  const text = page.blocks.map((block) => block.text).join('\n\n');
  const figures = page.figures.map((figure) => `![${figure.alt || figure.name}](figures/${figure.name})`).join('\n\n');
  return `<a id="page-${page.number}"></a>\n\n## Page ${page.number}\n\n${text}${figures ? `\n\n${figures}` : ''}`;
}

export function markdownFor(doc: ScanDocument): string {
  return `# ${doc.title}\n\n> Locally recognized from ${doc.sourceName}. Verify against the page anchors before quoting.\n\n${doc.pages.map(pageMarkdown).join('\n\n---\n\n')}\n`;
}

export function plainTextFor(doc: ScanDocument): string {
  return doc.pages.map((page) => `[Page ${page.number}]\n${page.blocks.map((block) => block.text).join('\n')}`).join('\n\n');
}

export function ssmlFor(doc: ScanDocument): string {
  const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<speak>\n${doc.pages.map((page) => `  <mark name="page-${page.number}"/>\n  <p>${escape(page.blocks.map((block) => block.text).join(' '))}</p>`).join('\n')}\n</speak>`;
}

export function sourceMapFor(doc: ScanDocument): string {
  return JSON.stringify({
    format: 'scan-reading-pack/source-map-v1',
    source: doc.sourceName,
    pages: doc.pages.map((page) => ({
      page: page.number,
      width: page.width,
      height: page.height,
      blocks: page.blocks.map(({ id, text, confidence, box, reviewed }) => ({ id, text, confidence, box, reviewed })),
      figures: page.figures.map(({ id, name, box, alt }) => ({ id, name, box, alt })),
    })),
  }, null, 2);
}

function htmlFor(doc: ScanDocument): string {
  const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const pages = doc.pages.map((page) => `<section id="page-${page.number}"><p class="page">Original page ${page.number}</p>${page.blocks.map((block) => `<p data-source="page-${page.number}:${Math.round(block.box.x0)},${Math.round(block.box.y0)},${Math.round(block.box.x1)},${Math.round(block.box.y1)}">${escape(block.text)}</p>`).join('')}</section>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(doc.title)}</title><style>body{font:18px/1.65 Georgia,serif;max-width:44rem;margin:auto;padding:2rem;color:#171717;background:#faf7ef}.page{font:700 13px system-ui;color:#555;border-top:2px solid #111;padding-top:1rem;margin-top:4rem}p{white-space:pre-wrap}</style><main><h1>${escape(doc.title)}</h1>${pages}</main></html>`;
}

async function figureBytes(figure: Figure): Promise<Uint8Array> {
  return new Uint8Array(await figure.blob.arrayBuffer());
}

export async function downloadPack(doc: ScanDocument, includeSsml: boolean): Promise<void> {
  const files: Record<string, Uint8Array> = {
    'README.txt': strToU8(`Scan Reading Pack\n\nSource: ${doc.sourceName}\nEvery section links to an original page number. Coordinates are in source-map.json. OCR can be wrong; verify important quotations against the original scan.\n`),
    'reading.md': strToU8(markdownFor(doc)),
    'reading.txt': strToU8(plainTextFor(doc)),
    'reading.html': strToU8(htmlFor(doc)),
    'source-map.json': strToU8(sourceMapFor(doc)),
  };
  if (includeSsml) files['audiobook.ssml'] = strToU8(ssmlFor(doc));
  for (const page of doc.pages) for (const figure of page.figures) files[`figures/${figure.name}`] = await figureBytes(figure);
  const zip = zipSync(files, { level: 6 });
  downloadBlob(new Blob([zip as BlobPart], { type: 'application/zip' }), `${safeName(doc.title)}-reading-pack.zip`);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
