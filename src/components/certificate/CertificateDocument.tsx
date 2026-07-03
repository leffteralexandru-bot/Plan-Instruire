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
} from '@/lib/certificateContent';
import {
  formatNivelLine,
  formatTestLine,
  type CertificateMetrics,
} from '@/lib/certificateMetrics';

interface CertificateDocumentProps {
  certificate: Certificate;
  certNo: string;
  metrics?: CertificateMetrics | null;
}

function CertificateResultsBlock({ metrics }: { metrics: CertificateMetrics }) {
  const nivelLine = formatNivelLine(metrics);
  const testLine = formatTestLine(metrics);
  if (!nivelLine && !testLine) return null;

  return (
    <div className="rounded-lg border border-[#c9d9e8] bg-[#f0f6fc] px-4 py-3 text-sm text-slate-600 space-y-1 mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-corporate-muted mb-1">
        Rezultate evaluare instruire
      </p>
      {nivelLine && (
        <p>
          <span className="text-corporate-muted">Nivel profesional:</span>{' '}
          <strong>{nivelLine}</strong>
        </p>
      )}
      {testLine && (
        <p>
          <span className="text-corporate-muted">Test teoretic (medie):</span>{' '}
          <strong>{testLine}</strong>
        </p>
      )}
    </div>
  );
}

export function CertificateDocument({ certificate, certNo, metrics }: CertificateDocumentProps) {
  return (
    <div className="certificate-doc rounded-xl border-2 border-[#B38F55]/60 bg-[#fcfaf7] p-6 sm:p-8 shadow-inner">
      <div className="rounded-lg bg-corporate-black text-white px-4 py-3 mb-5">
        <p className="text-lg tracking-wide">
          <span className="font-normal">art</span>
          <span className="font-bold">GRANIT</span>
        </p>
        <p className="text-[10px] text-corporate-gold/90 mt-0.5 uppercase tracking-wider">
          {CERTIFICATE_DEPARTMENT}
        </p>
      </div>

      <div className="text-center space-y-2 mb-5">
        <p className="text-xs font-bold tracking-[0.2em] text-[#B38F55] uppercase">
          Certificat de finalizare
        </p>
        <p className="text-[10px] text-corporate-muted uppercase tracking-wide">
          {CERTIFICATE_PROGRAM_TITLE}
        </p>
        <div className="mx-auto h-px w-24 bg-[#B38F55]/50" />
      </div>

      <p className="text-sm text-slate-600 italic text-center leading-relaxed mb-4">
        {certificateIntro()}
      </p>

      <p className="text-center text-xs text-corporate-muted mb-1">Se certifică că</p>
      <p className="text-center text-2xl font-bold text-corporate-dark tracking-wide uppercase mb-3">
        {certificate.stagiarName}
      </p>

      <p className="text-sm text-slate-600 text-center leading-relaxed mb-5">
        {certificateBodyLine()}
      </p>

      <div className="rounded-lg border border-[#e2d5bc] bg-[#f8f6f2] px-4 py-3 text-sm text-slate-600 space-y-1 mb-5">
        <p>
          <span className="text-corporate-muted">Funcție:</span> <strong>{CERTIFICATE_ROLE}</strong>
        </p>
        <p>
          <span className="text-corporate-muted">Durată program:</span> {CERTIFICATE_DURATION}
        </p>
        <p>
          <span className="text-corporate-muted">Versiune program:</span> {certificate.programVersion}
        </p>
        <p>
          <span className="text-corporate-muted">Mentor responsabil:</span> {certificate.mentorName}
        </p>
        <p>
          <span className="text-corporate-muted">Data emiterii:</span>{' '}
          {formatCertificateDate(certificate.issuedAt)}
        </p>
        <p>
          <span className="text-corporate-muted">Nr. certificat:</span>{' '}
          <span className="font-mono text-xs">{certNo}</span>
        </p>
      </div>

      {metrics && <CertificateResultsBlock metrics={metrics} />}

      <p className="text-xs text-slate-500 italic text-center leading-relaxed mb-6">
        {certificateClosing()}
      </p>

      <div className="grid grid-cols-2 gap-6 text-center text-xs text-corporate-muted pt-2 border-t border-slate-200">
        <div>
          <p className="font-semibold text-corporate-dark mb-6">{certificate.mentorName}</p>
          <div className="border-t border-slate-300 pt-1">Mentor instruire</div>
        </div>
        <div>
          <p className="font-semibold text-corporate-dark mb-6">&nbsp;</p>
          <div className="border-t border-slate-300 pt-1">Reprezentant artGRANIT</div>
        </div>
      </div>

      <p className="text-[10px] text-center text-corporate-muted mt-5">
        Document digital autentic · artGRANIT © {new Date().getFullYear()}
      </p>
    </div>
  );
}

export function getCertificatePrintHtml(
  certificate: Certificate,
  certNo: string,
  metrics?: CertificateMetrics | null,
): string {
  const intro = certificateIntro();
  const body = certificateBodyLine();
  const closing = certificateClosing();
  const date = formatCertificateDate(certificate.issuedAt);
  const nivelLine = metrics ? formatNivelLine(metrics) : null;
  const testLine = metrics ? formatTestLine(metrics) : null;
  const resultsHtml =
    nivelLine || testLine
      ? `<div style="background:#f0f6fc;border:1px solid #c9d9e8;border-radius:8px;padding:14px 18px;font-size:12px;line-height:1.9;color:#475569;margin-bottom:20px;">
          <div style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:6px;">Rezultate evaluare instruire</div>
          ${nivelLine ? `<div><strong>Nivel profesional:</strong> ${nivelLine}</div>` : ''}
          ${testLine ? `<div><strong>Test teoretic (medie):</strong> ${testLine}</div>` : ''}
        </div>`
      : '';

  return `
    <div style="max-width:720px;margin:0 auto;font-family:Georgia,'Times New Roman',serif;color:#1e293b;padding:40px;border:2px solid #B38F55;background:#fcfaf7;">
      <div style="background:#0c0c0c;color:#fff;padding:16px 20px;margin-bottom:24px;border-radius:6px;">
        <div style="font-size:22px;"><span>art</span><strong>GRANIT</strong></div>
        <div style="font-size:10px;color:#d4b87a;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">${CERTIFICATE_DEPARTMENT}</div>
      </div>
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:bold;letter-spacing:0.15em;color:#B38F55;text-transform:uppercase;">Certificat de finalizare</div>
        <div style="font-size:10px;color:#64748b;margin-top:4px;text-transform:uppercase;">${CERTIFICATE_PROGRAM_TITLE}</div>
        <hr style="width:96px;border:none;border-top:1px solid #B38F55;margin:12px auto;opacity:0.5;" />
      </div>
      <p style="font-size:13px;font-style:italic;text-align:center;line-height:1.7;color:#475569;margin-bottom:20px;">${intro}</p>
      <p style="text-align:center;font-size:11px;color:#64748b;">Se certifică că</p>
      <p style="text-align:center;font-size:26px;font-weight:bold;text-transform:uppercase;margin:8px 0 16px;">${certificate.stagiarName}</p>
      <p style="font-size:13px;text-align:center;line-height:1.7;color:#475569;margin-bottom:24px;">${body}</p>
      <div style="background:#f8f6f2;border:1px solid #e2d5bc;border-radius:8px;padding:16px 20px;font-size:13px;line-height:1.9;color:#475569;margin-bottom:24px;">
        <div><strong>Funcție:</strong> ${CERTIFICATE_ROLE}</div>
        <div><strong>Durată program:</strong> ${CERTIFICATE_DURATION}</div>
        <div><strong>Versiune program:</strong> ${certificate.programVersion}</div>
        <div><strong>Mentor responsabil:</strong> ${certificate.mentorName}</div>
        <div><strong>Data emiterii:</strong> ${date}</div>
        <div><strong>Nr. certificat:</strong> ${certNo}</div>
      </div>
      ${resultsHtml}
      <p style="font-size:11px;font-style:italic;text-align:center;line-height:1.6;color:#64748b;margin-bottom:32px;">${closing}</p>
      <table style="width:100%;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;font-size:11px;color:#64748b;">
        <tr>
          <td style="text-align:center;width:50%;padding-top:40px;border-top:1px solid #cbd5e1;">
            <strong style="color:#1e293b;display:block;margin-bottom:36px;">${certificate.mentorName}</strong>
            Mentor instruire
          </td>
          <td style="text-align:center;width:50%;padding-top:40px;border-top:1px solid #cbd5e1;">
            Reprezentant artGRANIT
          </td>
        </tr>
      </table>
      <p style="text-align:center;font-size:10px;color:#94a3b8;margin-top:28px;">Document digital autentic · artGRANIT © ${new Date().getFullYear()}</p>
    </div>
  `;
}

export { certificateNumber };
