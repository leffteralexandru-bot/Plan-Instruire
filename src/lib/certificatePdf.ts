import type { Certificate } from '@/types';

function formatRoDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function certificateNumber(cert: Certificate): string {
  if (cert.certificateNumber) return cert.certificateNumber;
  const year = new Date(cert.issuedAt).getFullYear();
  const hash = cert.stagiarName.replace(/\s/g, '').slice(0, 3).toUpperCase();
  return `AG-${year}-${hash}-${cert.issuedAt.slice(5, 10).replace('-', '')}`;
}

/** Certificat PDF branduit artGRANIT (jsPDF) */
export async function downloadCertificatePdf(certificate: Certificate): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const certNo = certificateNumber(certificate);

  doc.setFillColor(12, 12, 12);
  doc.rect(0, 0, w, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'normal');
  doc.text('art', 20, 14);
  const artW = doc.getTextWidth('art');
  doc.setFont('helvetica', 'bold');
  doc.text('GRANIT', 20 + artW, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Plan de Instruire și Adaptare Profesională', 20, 19);

  doc.setDrawColor(179, 143, 85);
  doc.setLineWidth(1.2);
  doc.line(20, 28, w - 20, 28);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('Certificat de Finalizare', w / 2, 48, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Se certifică faptul că', w / 2, 62, { align: 'center' });

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(certificate.stagiarName, w / 2, 74, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const lines = [
    'a finalizat cu succes programul de instruire pentru rolul de',
    'Inginer Proiectant — artGRANIT',
    '',
    `Program versiunea: ${certificate.programVersion}`,
    `Mentor: ${certificate.mentorName}`,
    `Data emiterii: ${formatRoDate(certificate.issuedAt)}`,
    `Nr. certificat: ${certNo}`,
  ];
  let y = 88;
  for (const line of lines) {
    doc.text(line, w / 2, y, { align: 'center' });
    y += 8;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(40, h - 35, w - 40, h - 35);
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Document generat digital · artGRANIT © ' + new Date().getFullYear(), w / 2, h - 28, {
    align: 'center',
  });
  doc.text('Verificare: ' + certNo, w / 2, h - 22, { align: 'center' });

  const safeName = certificate.stagiarName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  doc.save(`certificat-artgranit-${safeName}.pdf`);
}

export { certificateNumber };
