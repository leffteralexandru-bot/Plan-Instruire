/**
 * Descărcare fișier local (blob) pentru acces offline (PDF, ZIP, etc.).
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
