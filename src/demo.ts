import type { ScanDocument } from './types';

const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1550" viewBox="0 0 1200 1550">
  <rect width="1200" height="1550" fill="#f6f1e3"/>
  <rect x="74" y="74" width="1052" height="1402" fill="none" stroke="#193340" stroke-width="4"/>
  <text x="120" y="205" fill="#10222c" font-family="Georgia, serif" font-size="58">THE NIGHT READING ROOM</text>
  <line x1="120" y1="240" x2="1080" y2="240" stroke="#40717a" stroke-width="4"/>
  <text x="120" y="345" fill="#263c43" font-family="Georgia, serif" font-size="32">A marked sample page for reviewing a scan beside its text.</text>
  <text x="120" y="450" fill="#263c43" font-family="Georgia, serif" font-size="32">At closing time, the librarian set aside one small lamp.</text>
  <text x="120" y="510" fill="#263c43" font-family="Georgia, serif" font-size="32">Each page kept a route back to the paper from which it came.</text>
  <rect x="120" y="640" width="960" height="420" fill="#d3e5de" stroke="#40717a" stroke-width="4"/>
  <path d="M230 930 C390 690 620 1080 790 760 C890 590 980 770 1010 710" fill="none" stroke="#50a8ad" stroke-width="18"/>
  <text x="120" y="1170" fill="#263c43" font-family="Georgia, serif" font-size="32">Use the trace buttons to light the source region for each line.</text>
  <text x="120" y="1230" fill="#263c43" font-family="Georgia, serif" font-size="32">Then export a pack with text, source pages, and page coordinates.</text>
  <text x="120" y="1390" fill="#40717a" font-family="monospace" font-size="24">SAMPLE PAGE 1 · SCAN READING PACK</text>
</svg>`;

function box(x0: number, y0: number, x1: number, y1: number) {
  return { x0, y0, x1, y1 };
}

export function createSampleDocument(): ScanDocument {
  const now = Date.now();
  return {
    id: 'demo-night-reading-room',
    title: 'The Night Reading Room — sample',
    sourceName: 'night-reading-room-sample.svg',
    createdAt: now,
    updatedAt: now,
    pages: [{
      id: 'demo-page-1', number: 1, width: 1200, height: 1550,
      image: new Blob([sampleSvg], { type: 'image/svg+xml' }),
      status: 'done', figures: [],
      blocks: [
        { id: 'demo-line-1', text: 'THE NIGHT READING ROOM', originalText: 'THE NIGHT READING ROOM', confidence: 99, reviewed: false, box: box(115, 145, 940, 220) },
        { id: 'demo-line-2', text: 'At closing time, the librarian set aside one small lamp.', originalText: 'At closing time, the librarian set aside one small lamp.', confidence: 96, reviewed: false, box: box(115, 405, 1050, 470) },
        { id: 'demo-line-3', text: 'Each page kept a route back to the paper from which it came.', originalText: 'Each page kept a route back to the paper from which it came.', confidence: 78, reviewed: false, box: box(115, 475, 1080, 535) },
        { id: 'demo-line-4', text: 'Use the trace buttons to light the source region for each line.', originalText: 'Use the trace buttons to light the source region for each line.', confidence: 93, reviewed: false, box: box(115, 1125, 1080, 1190) },
        { id: 'demo-line-5', text: 'Then export a pack with text, source pages, and page coordinates.', originalText: 'Then export a pack with text, source pages, and page coordinates.', confidence: 95, reviewed: false, box: box(115, 1190, 1090, 1255) },
      ],
    }],
  };
}
