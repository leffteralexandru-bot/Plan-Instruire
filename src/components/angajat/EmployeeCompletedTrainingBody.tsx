import { useState } from 'react';
import { useTrainingPlan } from '@/hooks/useTrainingPlan';
import { useProgress } from '@/hooks/useProgress';
import { ProgressProvider } from '@/hooks/useProgress';
import { InitialTrainingPlanProgressSection } from '@/components/training/InitialTrainingPlanProgressSection';
import { CertificateModal } from '@/components/certificate/CertificateModal';

function CompletedTrainingContent() {
  const plan = useTrainingPlan();
  const { stats, isDayComplete, isDayUnlocked, progress } = useProgress();
  const certificate = progress?.certificate;
  const [planExpanded, setPlanExpanded] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);

  return (
    <>
      <InitialTrainingPlanProgressSection
        totalDays={stats.totalDays}
        weekProgress={stats.weekProgress}
        overallPercent={stats.overallPercent}
        plan={plan}
        isDayComplete={isDayComplete}
        isDayUnlocked={isDayUnlocked}
        certificateIssued={!!certificate}
        onOpenCertificate={certificate ? () => setCertificateOpen(true) : undefined}
        expanded={planExpanded}
        onExpandedChange={setPlanExpanded}
      />
      {certificate && progress?.userId && (
        <CertificateModal
          certificate={certificate}
          angajatId={progress.userId}
          open={certificateOpen}
          onClose={() => setCertificateOpen(false)}
        />
      )}
    </>
  );
}

/** Plan inițial finalizat — același conținut ca pe Plan instruire, dar doar în Panou Angajat. */
export function EmployeeCompletedTrainingBody({ angajatId }: { angajatId: string }) {
  return (
    <ProgressProvider userId={angajatId}>
      <CompletedTrainingContent />
    </ProgressProvider>
  );
}
