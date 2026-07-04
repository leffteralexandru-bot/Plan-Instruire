import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStagiarSelection, useCanSelectStagiar } from '@/context/StagiarContext';
import { useAuth } from '@/hooks/useAuth';
import { buildTraineeHrReport, getPendingMentorValidations } from '@/lib/hrReport';
import { getTraineeStatus, getTraineeStatusLabel } from '@/lib/hrAnalytics';
import { storage } from '@/store/storage';
import { ingineriPath } from '@/data/departments';
import { Badge } from '@/components/ui/Badge';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import type { TraineeProfile } from '@/types';

function statusBadgeVariant(
  status: ReturnType<typeof getTraineeStatus>,
): 'success' | 'warning' | 'info' | 'default' | 'locked' {
  if (status === 'completed') return 'success';
  if (status === 'behind' || status === 'at_risk') return 'warning';
  if (status === 'not_started') return 'locked';
  return 'info';
}

interface TraineeRowProps {
  trainee: TraineeProfile;
  selected: boolean;
  isOwnPlan?: boolean;
  onSelect: () => void;
}

function TraineeRow({ trainee, selected, isOwnPlan, onSelect }: TraineeRowProps) {
  const report = useMemo(
    () => buildTraineeHrReport(trainee, storage.getProgress(trainee.id)),
    [trainee],
  );
  const status = getTraineeStatus(report);
  const pending = getPendingMentorValidations(storage.getProgress(trainee.id));

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors',
        selected
          ? 'border-corporate-gold/50 bg-corporate-gold-light/15 ring-1 ring-corporate-gold/30'
          : 'border-corporate-border hover:border-corporate-gold/50 hover:bg-corporate-gold-light/10',
      ].join(' ')}
    >
      <div className="min-w-0">
        <strong className="text-corporate-dark">{trainee.name}</strong>
        {isOwnPlan ? (
          <span className="text-corporate-gold ml-2 text-xs font-medium">Plan de Instruire</span>
        ) : (
          <span className="text-corporate-muted ml-2">{trainee.email}</span>
        )}
        <p className="text-xs text-corporate-muted mt-1">
          {report.completedDays}/{report.totalDays} zile · {report.progressPercent}% complet
          {selected ? ' · vizualizare activă' : ''}
        </p>
        {pending.length > 0 && (
          <p className="text-xs text-amber-700 mt-0.5">Validare mentor: Z{pending.join(', Z')}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={statusBadgeVariant(status)}>{getTraineeStatusLabel(status)}</Badge>
        {selected && (
          <span className="text-corporate-gold text-xs font-medium">Selectat</span>
        )}
      </div>
    </button>
  );
}

export function TraineeSelector() {
  const { user } = useAuth();
  const canSelect = useCanSelectStagiar();
  const { stagiari, selectedStagiarId, setSelectedStagiarId } = useStagiarSelection();

  if (!canSelect || stagiari.length === 0) return null;

  return (
    <ProfessionalPanel
      variant="training"
      icon="mentor"
      eyebrow="Monitorizare instruire"
      title="Angajat în planul de instruire"
      subtitle="Selectați angajatul a cărui progres îl vizualizați în planul zilnic"
      className="mb-0"
      badge={
        <Badge variant="info">
          {stagiari.length} {stagiari.length === 1 ? 'angajat' : 'angajați'}
        </Badge>
      }
      footer={
        <>
          Progresul, zilele și validările reflectă angajatul selectat. Pentru acțiuni de mentor, accesați{' '}
          <Link to={ingineriPath('/mentor')} className="font-medium text-corporate-gold hover:underline">
            Panoul Mentor
          </Link>
          .
        </>
      }
    >
      <ul className="space-y-2" role="listbox" aria-label="Alegeți angajatul monitorizat">
        {stagiari.map((trainee) => (
          <li key={trainee.id}>
            <TraineeRow
              trainee={trainee}
              selected={selectedStagiarId === trainee.id}
              isOwnPlan={trainee.id === user?.id}
              onSelect={() => setSelectedStagiarId(trainee.id)}
            />
          </li>
        ))}
      </ul>
    </ProfessionalPanel>
  );
}
