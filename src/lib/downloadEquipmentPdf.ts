/**
 * Descărcare / trimitere fișier local (PDF, ZIP, etc.).
 */

export async function downloadEquipmentPdf(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fișier indisponibil (${response.status})`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  const hasExt = /\.[a-z0-9]{2,5}$/i.test(filename);
  anchor.download = hasExt ? filename : `${filename}.pdf`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

function absoluteFileUrl(url: string): string {
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}

function mimeForFilename(filename: string, fallback: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.zip')) return 'application/zip';
  if (lower.endsWith('.png')) return 'image/png';
  return fallback || 'application/octet-stream';
}

export type ShareEquipmentResult = 'shared-file' | 'shared-link' | 'mailto' | 'copied';

/**
 * Trimite PDF-ul cuiva: pe telefon folosește Share (WhatsApp, Mail, etc.);
 * pe desktop fără Share → mailto cu link; ultim fallback → copiază linkul.
 */
export async function shareEquipmentPdf(
  url: string,
  filename: string,
  options?: { title?: string; text?: string },
): Promise<ShareEquipmentResult> {
  const absoluteUrl = absoluteFileUrl(url);
  const title = options?.title ?? filename;
  const text =
    options?.text ??
    `Ghid teren artGRANIT — ${title}. Deschide / descarcă: ${absoluteUrl}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fișier indisponibil (${response.status})`);
  }
  const blob = await response.blob();
  const type = mimeForFilename(filename, blob.type);
  const file = new File([blob], filename, { type });

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };

  if (typeof nav.share === 'function') {
    try {
      if (typeof nav.canShare === 'function' && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title, text });
        return 'shared-file';
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      // continuă cu share link / mailto
    }

    try {
      await nav.share({ title, text, url: absoluteUrl });
      return 'shared-link';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
    }
  }

  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(text);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
  return 'mailto';
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}
