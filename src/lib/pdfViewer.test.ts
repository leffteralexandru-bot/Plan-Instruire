import { describe, expect, it, vi, afterEach } from 'vitest';
import { isPdfOnlyChapter, prefersExternalPdfOpen, toAbsoluteUrl } from '@/lib/pdfViewer';

describe('pdfViewer', () => {
  const original = globalThis.window;

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(globalThis, 'window', { value: original, configurable: true });
  });

  it('detectează iPhone ca external PDF', () => {
    vi.stubGlobal('navigator', { userAgent: 'iPhone', maxTouchPoints: 5 });
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true }),
      location: { origin: 'https://example.com' },
    });
    expect(prefersExternalPdfOpen()).toBe(true);
  });

  it('capitol PDF-only fără pagini', () => {
    expect(isPdfOnlyChapter({ pdfUrl: '/a.pdf', pages: [] })).toBe(true);
    expect(isPdfOnlyChapter({ pdfUrl: '/a.pdf', pages: [{ id: '1' }] })).toBe(false);
    expect(isPdfOnlyChapter({ pages: [] })).toBe(false);
  });

  it('toAbsoluteUrl păstrează URL absolut', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });
    expect(toAbsoluteUrl('https://cdn.example/x.pdf')).toBe('https://cdn.example/x.pdf');
  });
});
