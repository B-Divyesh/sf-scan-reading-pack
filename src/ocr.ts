import type { ScanPage, TextBlock } from './types';

type Progress = { status: string; progress: number };

export async function recognizePage(page: ScanPage, onProgress: (message: Progress) => void): Promise<TextBlock[]> {
  const { createWorker, OEM, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/',
    langPath: '/tessdata/',
    gzip: true,
    logger: onProgress,
  });
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });
    const result = await worker.recognize(page.image);
    const lines = result.data.lines || [];
    if (lines.length) {
      return lines
        .filter((line) => line.text.trim())
        .map((line, index) => ({
          id: crypto.randomUUID(),
          text: line.text.trim(),
          originalText: line.text.trim(),
          confidence: Math.round(line.confidence),
          box: line.bbox,
          reviewed: line.confidence >= 82,
        }));
    }
    return result.data.text.split(/\n+/).filter(Boolean).map((text, index, all) => ({
      id: crypto.randomUUID(),
      text: text.trim(),
      originalText: text.trim(),
      confidence: Math.round(result.data.confidence),
      box: { x0: 0, y0: (page.height / all.length) * index, x1: page.width, y1: (page.height / all.length) * (index + 1) },
      reviewed: result.data.confidence >= 82,
    }));
  } finally {
    await worker.terminate();
  }
}
