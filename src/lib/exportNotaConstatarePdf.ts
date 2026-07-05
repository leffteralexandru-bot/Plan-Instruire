/** Formular oficial Art-Granit — text neschimbat, fișier sursă companie. */
export const NOTA_CONSTATARE_TEMPLATE_URL = '/forms/nota-constatare-refacere.pdf';

export const NOTA_CONSTATARE_TEMPLATE_FILENAME = 'nota-constatare-refacere.pdf';

export async function fetchNotaConstatareTemplateBlob(): Promise<Blob> {
  const res = await fetch(NOTA_CONSTATARE_TEMPLATE_URL);
  if (!res.ok) {
    throw new Error('Formularul oficial nu este disponibil. Contactați HR.');
  }
  return res.blob();
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Descarcă șablonul PDF oficial (completare manuală / print). */
export async function downloadNotaConstatareTemplate(
  filename = NOTA_CONSTATARE_TEMPLATE_FILENAME,
): Promise<void> {
  const blob = await fetchNotaConstatareTemplateBlob();
  triggerBrowserDownload(blob, filename);
}

/** @deprecated Folosiți downloadNotaConstatareTemplate — păstrat pentru compatibilitate dosar. */
export async function downloadNotaConstatarePdf(
  _data?: unknown,
  filename = NOTA_CONSTATARE_TEMPLATE_FILENAME,
): Promise<void> {
  await downloadNotaConstatareTemplate(filename);
}
