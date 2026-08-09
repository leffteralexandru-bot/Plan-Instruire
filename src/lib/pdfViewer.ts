/** Deschidere PDF pe telefon — browserele mobile nu afișează PDF în <iframe> ca pe PC. */

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (typeof window === 'undefined') return pathOrUrl;
  try {
    return new URL(pathOrUrl, window.location.origin).href;
  } catch {
    return pathOrUrl;
  }
}

/** iOS / Android / ecran îngust — PDF în iframe e gol sau cere „Deschide cu…”. */
export function prefersExternalPdfOpen(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPod|iPad/i.test(ua)) return true;
  // iPadOS raportează Macintosh + touch
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  if (/Android/i.test(ua)) return true;
  if (window.matchMedia('(max-width: 767px)').matches) return true;
  return false;
}

/**
 * Deschide PDF-ul în tab nou (viewer nativ pe telefon).
 * Apelează din handler de click — altfel popup-ul e blocat.
 * Nu face redirect pe același tab (ar pierde pagina app).
 */
export function openPdfInNewTab(pathOrUrl: string): boolean {
  const abs = toAbsoluteUrl(pathOrUrl);
  const win = window.open(abs, '_blank', 'noopener,noreferrer');
  return !!win;
}

export function isPdfOnlyChapter(chapter: {
  pdfUrl?: string;
  pages?: unknown[];
}): boolean {
  return !!chapter.pdfUrl && !(chapter.pages && chapter.pages.length > 0);
}
