import type { Certificate } from '@/types';
import {
  CERTIFICATE_DEPARTMENT,
  CERTIFICATE_DURATION,
  CERTIFICATE_PROGRAM_TITLE,
  CERTIFICATE_ROLE,
  certificateBodyLine,
  certificateClosing,
  certificateIntro,
  certificateNumber,
  formatCertificateDate,
  safeCertificateFilename,
} from '@/lib/certificateContent';
import {
  formatNivelLine,
  formatTestLine,
  resolveCertificateMetrics,
  type CertificateMetrics,
} from '@/lib/certificateMetrics';

/** Certificat PDF branduit artGRANIT — format profesional landscape */
export async function downloadCertificatePdf(
  certificate: Certificate,
  metrics?: CertificateMetrics | null,
): Promise<void> {
  const resolvedMetrics = metrics ?? resolveCertificateMetrics(certificate);
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const certNo = certificateNumber(certificate);
  const margin = 14;

  doc.setFillColor(252, 250, 247);
  doc.rect(0, 0, w, h, 'F');

  doc.setDrawColor(179, 143, 85);
  doc.setLineWidth(1.4);
  doc.rect(margin, margin, w - margin * 2, h - margin * 2);
  doc.setLineWidth(0.4);
  doc.rect(margin + 3, margin + 3, w - margin * 2 - 6, h - margin * 2 - 6);

  doc.setFillColor(12, 12, 12);
  doc.rect(margin + 3, margin + 3, w - margin * 2 - 6, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'normal');
  doc.text('art', margin + 10, margin + 14);
  const artW = doc.getTextWidth('art');
  doc.setFont('helvetica', 'bold');
  doc.text('GRANIT', margin + 10 + artW, margin + 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 200, 160);
  doc.text(CERTIFICATE_DEPARTMENT, margin + 10, margin + 18);

  doc.setTextColor(179, 143, 85);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICAT DE FINALIZARE', w / 2, margin + 32, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(CERTIFICATE_PROGRAM_TITLE.toUpperCase(), w / 2, margin + 38, { align: 'center' });

  doc.setDrawColor(179, 143, 85);
  doc.setLineWidth(0.6);
  doc.line(w / 2 - 45, margin + 42, w / 2 + 45, margin + 42);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);
  const introLines = doc.splitTextToSize(certificateIntro(), w - 70);
  let y = margin + 50;
  doc.text(introLines, w / 2, y, { align: 'center' });
  y += introLines.length * 4.2 + 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Se certifică că', w / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(certificate.stagiarName.toUpperCase(), w / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const bodyLines = doc.splitTextToSize(certificateBodyLine(), w - 60);
  doc.text(bodyLines, w / 2, y, { align: 'center' });
  y += bodyLines.length * 4.2 + 8;

  const metaX = w / 2 - 52;
  const metaW = 104;
  doc.setFillColor(248, 246, 242);
  doc.setDrawColor(226, 213, 188);
  doc.roundedRect(metaX, y, metaW, 32, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const meta = [
    `Funcție: ${CERTIFICATE_ROLE}`,
    `Durată program: ${CERTIFICATE_DURATION}`,
    `Versiune program: ${certificate.programVersion}`,
    `Mentor responsabil: ${certificate.mentorName}`,
    `Data emiterii: ${formatCertificateDate(certificate.issuedAt)}`,
  ];
  let my = y + 7;
  for (const line of meta) {
    doc.text(line, w / 2, my, { align: 'center' });
    my += 5;
  }
  y += 40;

  const nivelLine = resolvedMetrics ? formatNivelLine(resolvedMetrics) : null;
  const testLine = resolvedMetrics ? formatTestLine(resolvedMetrics) : null;
  if (nivelLine || testLine) {
    const boxH = (nivelLine ? 5 : 0) + (testLine ? 5 : 0) + 10;
    doc.setFillColor(240, 246, 252);
    doc.setDrawColor(201, 217, 232);
    doc.roundedRect(metaX, y, metaW, boxH, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('REZULTATE EVALUARE INSTRUIRE', w / 2, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    let ry = y + 11;
    if (nivelLine) {
      doc.text(`Nivel: ${nivelLine}`, w / 2, ry, { align: 'center' });
      ry += 5;
    }
    if (testLine) {
      doc.text(`Test: ${testLine}`, w / 2, ry, { align: 'center' });
    }
    y += boxH + 6;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  const closingLines = doc.splitTextToSize(certificateClosing(), w - 55);
  doc.text(closingLines, w / 2, y, { align: 'center' });
  y += closingLines.length * 3.8 + 10;

  const sigY = h - margin - 28;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(w / 2 - 55, sigY, w / 2 - 10, sigY);
  doc.line(w / 2 + 10, sigY, w / 2 + 55, sigY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Mentor instruire', w / 2 - 32, sigY + 5, { align: 'center' });
  doc.text('Reprezentant artGRANIT', w / 2 + 32, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(certificate.mentorName, w / 2 - 32, sigY - 2, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Document digital autentic · Nr. ${certNo} · artGRANIT © ${new Date().getFullYear()}`,
    w / 2,
    h - margin - 8,
    { align: 'center' },
  );

  doc.save(`certificat-artgranit-${safeCertificateFilename(certificate.stagiarName)}.pdf`);
}

export { certificateNumber } from '@/lib/certificateContent';
