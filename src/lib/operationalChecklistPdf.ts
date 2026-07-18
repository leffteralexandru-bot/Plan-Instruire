import { downloadEquipmentPdf } from '@/lib/downloadEquipmentPdf';

export async function downloadOperationalChecklistPdf(
  url: string,
  filename: string,
): Promise<void> {
  await downloadEquipmentPdf(url, filename);
}

/** Deschide PDF-ul pentru print (browser native). */
export function printOperationalChecklistPdf(url: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 60_000);
    }
  };
}
