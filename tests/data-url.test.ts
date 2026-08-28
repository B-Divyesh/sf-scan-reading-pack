import { describe, expect, it } from 'vitest';
import { backupImageFromDataUrl } from '../src/data-url';

describe('backup image decoding', () => {
  it('decodes an embedded image locally with its media type intact', async () => {
    const image = backupImageFromDataUrl('data:image/png;base64,aGVsbG8=');
    expect(image.type).toBe('image/png');
    expect(await image.text()).toBe('hello');
  });

  it.each([
    'https://example.com/source.png',
    'data:text/html;base64,aGVsbG8=',
    'data:image/png,not-base64',
    'data:image/png;base64,%%%%',
  ])('rejects a non-backup image URL: %s', (value) => {
    expect(() => backupImageFromDataUrl(value)).toThrow('Invalid backup image');
  });
});
