import { useMemo, useRef } from 'react';
import type { AppProgress, Certificate } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { downloadCertificatePdf } from '@/lib/certificatePdf';
import { resolveCertificateMetrics } from '@/lib/certificateMetrics';
import {
  CertificateDocument,
  certificateNumber,
  getCertificatePrintHtml,
} from '@/components/certificate/CertificateDocument';

interface CertificateViewProps {
  certificate: Certificate;
  /** card = în pagină; plain = în modal */
  variant?: 'card' | 'plain';
  /** Progres pentru certificat vechi fără metrici salvate la emitere */
  progress?: AppProgress;
}

export function CertificateView({ certificate, variant = 'card', progress }: CertificateViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const certNo = certificate.certificateNumber ?? certificateNumber(certificate);
  const metrics = useMemo(
    () => resolveCertificateMetrics(certificate, progress),
    [certificate, progress],
  );

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html lang="ro">
        <head>
          <meta charset="utf-8" />
          <title>Certificat artGRANIT — ${certificate.stagiarName}</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { margin: 0; background: #fff; }
          </style>
        </head>
        <body>${getCertificatePrintHtml(certificate, certNo, metrics)}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const handlePdf = async () => {
    await downloadCertificatePdf({ ...certificate, certificateNumber: certNo }, metrics);
  };

  const body = (
    <>
      <div ref={printRef}>
        <CertificateDocument certificate={certificate} certNo={certNo} metrics={metrics} />
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="primary" onClick={handlePdf}>
          Descarcă PDF artGRANIT
        </Button>
        <Button variant="secondary" onClick={handlePrint}>
          Printează
        </Button>
      </div>
    </>
  );

  if (variant === 'plain') {
    return <div>{body}</div>;
  }

  return <Card className="border-corporate-gold/30 bg-corporate-gold-light/20 p-1">{body}</Card>;
}

interface CertificateIssueProps {
  stagiarName: string;
  mentorName: string;
  onIssue: (mentorName: string, stagiarName: string) => void;
  existing?: Certificate;
  progress?: AppProgress;
}

export function CertificateIssue({ stagiarName, mentorName, onIssue, existing, progress }: CertificateIssueProps) {
  if (existing) return <CertificateView certificate={existing} progress={progress} />;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark">Certificat de finalizare — Ziua 20</h2>
      <p className="text-sm text-corporate-muted mt-1 mb-4">
        După validarea evaluării finale, emiteți certificatul digital oficial artGRANIT pentru stagiar.
      </p>
      <Button variant="secondary" onClick={() => onIssue(mentorName, stagiarName)}>
        Emite certificat digital
      </Button>
    </Card>
  );
}
