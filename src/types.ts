export type Box = { x0: number; y0: number; x1: number; y1: number };

export type TextBlock = {
  id: string;
  text: string;
  originalText: string;
  confidence: number;
  box: Box;
  reviewed: boolean;
};

export type Figure = {
  id: string;
  name: string;
  blob: Blob;
  box: Box;
  alt: string;
};

export type ScanPage = {
  id: string;
  number: number;
  width: number;
  height: number;
  image: Blob;
  blocks: TextBlock[];
  figures: Figure[];
  status: 'ready' | 'recognizing' | 'done' | 'error';
};

export type ScanDocument = {
  id: string;
  title: string;
  sourceName: string;
  createdAt: number;
  updatedAt: number;
  pages: ScanPage[];
};

export type LicenseState = {
  token: string | null;
  valid: boolean;
  checkedAt: number;
  reason?: string;
};
