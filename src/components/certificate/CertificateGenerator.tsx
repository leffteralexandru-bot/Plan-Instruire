import { useRef } from 'react';
import type { Certificate } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { downloadCertificatePdf, certificateNumber } from '@/lib/certificatePdf';

interface CertificateViewProps {
  certificate: Certificate;
}

export function CertificateView({ certificate }: CertificateViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const certNo = certificate.certificateNumber ?? certificateNumber(certificate);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Certificat artGRANIT</title>
      <style>
        body { font-family: Georgia, serif; padding: 48px; color: #1e293b; }
        h1 { font-size: 28px; border-bottom: 3px solid #B38F55; padding-bottom: 12px; }
        .meta { margin-top: 24px; line-height: 1.8; }
        .footer { margin-top: 48px; font-size: 12px; color: #64748b; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    w.document.close();
    w.print();
  };

  const handlePdf = async () => {
    await downloadCertificatePdf({ ...certificate, certificateNumber: certNo });
  };

  return (
    <Card className="border-corporate-gold/30 bg-corporate-gold-light/30">
      <div ref={printRef}>
        <h2 className="text-xl font-bold text-corporate-dark">Certificat de Finalizare Instruire</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p>Se certifică faptul că <strong>{certificate.stagiarName}</strong> a finalizat cu succes</p>
          <p><strong>Planul de Instruire și Adaptare Profesională</strong></p>
          <p>Rol: <strong>Inginer Proiectant</strong></p>
          <p>Program versiunea: {certificate.programVersion}</p>
          <p>Mentor: {certificate.mentorName}</p>
          <p>Data: {new Date(certificate.issuedAt).toLocaleDateString('ro-RO')}</p>
          <p>Nr. certificat: {certNo}</p>
        </div>
        <p className="footer text-xs text-corporate-muted mt-6">artGRANIT — Document generat digital</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="primary" onClick={handlePdf}>
          Descarcă PDF artGRANIT
        </Button>
        <Button variant="secondary" onClick={handlePrint}>
          Printează
        </Button>
      </div>
    </Card>
  );
}

interface CertificateIssueProps {
  stagiarName: string;
  mentorName: string;
  onIssue: (mentorName: string, stagiarName: string) => void;
  existing?: Certificate;
}

export function CertificateIssue({ stagiarName, mentorName, onIssue, existing }: CertificateIssueProps) {
  if (existing) return <CertificateView certificate={existing} />;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark">Certificat finalizare — Ziua 20</h2>
      <p className="text-sm text-corporate-muted mt-1 mb-4">
        Emite certificatul branduit artGRANIT după validarea evaluării finale.
      </p>
      <Button variant="secondary" onClick={() => onIssue(mentorName, stagiarName)}>
        Emite certificat digital
      </Button>
    </Card>
  );
}
