import { useState } from 'react';
import { storage } from '@/store/storage';
import { buildTraineeHrReport } from '@/lib/hrReport';
import { userStore } from '@/lib/userStore';
import { TrainingCompleteCard } from '@/components/training/TrainingCompleteCard';
import { CertificateModal } from '@/components/certificate/CertificateModal';
import { Button } from '@/components/ui/Button';

interface EmployeeCertificateSectionProps {
  angajatId: string;
  /** Afișare compactă — doar buton, fără card complet */
  compact?: boolean;
}

export function EmployeeCertificateSection({ angajatId, compact }: EmployeeCertificateSectionProps) {
  const [open, setOpen] = useState(false);
  const progress = storage.getProgress(angajatId);
  const certificate = progress.certificate;

  if (!certificate) return null;

  const trainee = userStore.getTraineeProfiles().find((t) => t.id === angajatId);
  const report = trainee ? buildTraineeHrReport(trainee, progress) : null;
  const totalDays = report?.totalDays ?? 20;

  if (compact) {
    return (
      <>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Certificat
        </Button>
        <CertificateModal
          certificate={certificate}
          angajatId={angajatId}
          open={open}
          onClose={() => setOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <TrainingCompleteCard
        totalDays={totalDays}
        certificateIssued
        showPlanLink={false}
        onOpenCertificate={() => setOpen(true)}
      />
      <CertificateModal
        certificate={certificate}
        angajatId={angajatId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
