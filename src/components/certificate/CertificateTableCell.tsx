import { useState } from 'react';
import { storage } from '@/store/storage';
import { CertificateModal } from '@/components/certificate/CertificateModal';

interface CertificateTableCellProps {
  userId: string;
  issued: boolean;
}

export function CertificateTableCell({ userId, issued }: CertificateTableCellProps) {
  const [open, setOpen] = useState(false);
  const certificate = storage.getProgress(userId).certificate;

  if (!issued || !certificate) {
    return <span className="text-xs text-corporate-muted">Nu</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-corporate-gold hover:underline"
      >
        Certificat
      </button>
      <CertificateModal
        certificate={certificate}
        angajatId={userId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
