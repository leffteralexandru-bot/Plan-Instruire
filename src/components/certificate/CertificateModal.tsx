import { useEffect } from 'react';
import type { Certificate } from '@/types';
import { Button } from '@/components/ui/Button';
import { CertificateView } from '@/components/certificate/CertificateGenerator';
import { TrainingCompletionDossier } from '@/components/training/TrainingCompletionDossier';
import { storage } from '@/store/storage';

interface CertificateModalProps {
  certificate: Certificate;
  angajatId: string;
  open: boolean;
  onClose: () => void;
}

export function CertificateModal({ certificate, angajatId, open, onClose }: CertificateModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 transition-all duration-300 @md:items-center @md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Închide certificatul"
        onClick={onClose}
      />
      <div className="relative z-10 h-[100dvh] w-full overflow-y-auto rounded-none border border-corporate-gold/40 bg-white p-4 shadow-xl transition-all duration-300 @md:h-auto @md:max-h-[92vh] @md:max-w-2xl @md:rounded-xl @md:p-5">
        <div className="flex items-start justify-between gap-3 mb-4 sticky top-0 bg-white pb-2 border-b border-slate-100 z-10">
          <h2 id="certificate-modal-title" className="text-sm font-semibold text-corporate-dark">
            Certificat plan instruire la angajare
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Închide
          </Button>
        </div>
        <CertificateView certificate={certificate} variant="plain" progress={storage.getProgress(angajatId)} />
        <TrainingCompletionDossier angajatId={angajatId} />
      </div>
    </div>
  );
}
