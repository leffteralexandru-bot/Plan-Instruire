import type { jsPDF } from 'jspdf';
import dejavuSansUrl from 'dejavu-fonts-ttf/ttf/DejaVuSans.ttf?url';
import dejavuBoldUrl from 'dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf?url';

export const PDF_FONT = 'DejaVuSans';

const registeredDocs = new WeakSet<jsPDF>();

async function fontToBase64(url: string): Promise<string> {
  const buffer = await fetch(url).then((r) => r.arrayBuffer());
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

/** Înregistrează DejaVu Sans (suportă diacritice românești) pe documentul PDF */
export async function registerPdfUnicodeFonts(doc: jsPDF): Promise<void> {
  if (!registeredDocs.has(doc)) {
    const [normal, bold] = await Promise.all([
      fontToBase64(dejavuSansUrl),
      fontToBase64(dejavuBoldUrl),
    ]);
    doc.addFileToVFS('DejaVuSans.ttf', normal);
    doc.addFont('DejaVuSans.ttf', PDF_FONT, 'normal');
    doc.addFileToVFS('DejaVuSans-Bold.ttf', bold);
    doc.addFont('DejaVuSans-Bold.ttf', PDF_FONT, 'bold');
    registeredDocs.add(doc);
  }
  doc.setFont(PDF_FONT, 'normal');
}

export function setPdfFont(doc: jsPDF, style: 'normal' | 'bold' = 'normal'): void {
  doc.setFont(PDF_FONT, style);
}
