import { describe, expect, it } from 'vitest';
import { markdownFor, plainTextFor, safeName, sourceMapFor, ssmlFor } from '../src/exporter';
import type { ScanDocument } from '../src/types';

const document: ScanDocument = {
  id: 'doc-1', title: 'A Reader’s Test', sourceName: 'scan.pdf', createdAt: 1, updatedAt: 1,
  pages: [{
    id: 'page-1', number: 12, width: 1000, height: 1400, image: new Blob(), status: 'done', figures: [],
    blocks: [{ id: 'line-1', text: 'Truth & method.', originalText: 'Truth & method.', confidence: 77, reviewed: true, box: { x0: 10, y0: 20, x1: 300, y1: 60 } }],
  }],
};

describe('reading pack exports', () => {
  it('keeps a visible page anchor in Markdown and plain text', () => {
    expect(markdownFor(document)).toContain('<a id="page-12"></a>');
    expect(markdownFor(document)).toContain('Truth & method.');
    expect(plainTextFor(document)).toContain('[Page 12]');
  });

  it('escapes SSML and preserves a spoken page marker', () => {
    expect(ssmlFor(document)).toContain('<mark name="page-12"/>');
    expect(ssmlFor(document)).toContain('Truth &amp; method.');
  });

  it('exports original coordinates and confidence', () => {
    const map = JSON.parse(sourceMapFor(document));
    expect(map.pages[0].blocks[0]).toMatchObject({ confidence: 77, box: { x0: 10, y0: 20, x1: 300, y1: 60 } });
  });

  it('creates safe filenames', () => {
    expect(safeName('A Reader’s Test')).toBe('a-reader-s-test');
  });
});
