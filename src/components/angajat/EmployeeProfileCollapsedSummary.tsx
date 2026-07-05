import type { ReactNode } from 'react';
import { formatCoeficientSalarial } from '@/lib/competencyScoring';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { PROGRAM_AREA_THEMES, type ProgramArea } from '@/lib/programAreaTheme';
import type { CompletedEvaluationSummary } from '@/lib/evaluationDisplay';
import type { TraineeHrReport } from '@/lib/hrReport';
import type { Certificate, ReTrainingSession } from '@/types';

function StatTile({
  area,
  label,
  value,
  hint,
}: {
  area: ProgramArea;
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  const theme = PROGRAM_AREA_THEMES[area];
  return (
    <div className={`rounded-lg border px-2 py-2 text-center min-w-0 ${theme.summaryCard}`}>
      <div className={`mx-auto mb-1 h-1 w-6 rounded-full ${theme.accentBar}`} aria-hidden />
      <p className={`text-[9px] font-semibold uppercase tracking-wide truncate ${theme.summaryLabel}`}>
        {label}
      </p>
      <p className="text-sm font-bold text-corporate-dark tabular-nums leading-tight mt-0.5">
        {value}
      </p>
      {hint ? (
        <p className="text-[10px] text-corporate-muted mt-0.5 truncate">{hint}</p>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-corporate-muted">{label}</p>
      <p className="text-sm font-medium text-corporate-dark truncate">{value}</p>
    </div>
  );
}

function RelationCell({ label, name }: { label: string; name?: string }) {
  return (
    <div className="rounded-lg border border-corporate-border/70 bg-corporate-surface/25 px-3 py-2.5 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-corporate-muted">
        {label}
      </p>
      <p className="text-sm font-medium text-corporate-dark truncate mt-0.5">{name ?? '—'}</p>
    </div>
  );
}

export interface EmployeeProfileCollapsedSummaryProps {
  email?: string;
  functie?: string;
  supervisorName?: string;
  mentorName?: string;
  trainingReport?: TraineeHrReport | null;
  trainingFinished: boolean;
  certificate?: Certificate;
  retrainingSessions: ReTrainingSession[];
  evalHistory: CompletedEvaluationSummary[];
  latestMajorarePct?: number;
  /** Doar cele 4 carduri de parcurs (secțiunea realizări, când e restrânsă) */
  achievementsOnly?: boolean;
}

function AchievementTiles({
  trainingReport,
  trainingFinished,
  certificate,
  retrainingSessions,
  evalHistory,
  latestMajorarePct,
}: Pick<
  EmployeeProfileCollapsedSummaryProps,
  | 'trainingReport'
  | 'trainingFinished'
  | 'certificate'
  | 'retrainingSessions'
  | 'evalHistory'
  | 'latestMajorarePct'
>) {
  const completedRetrainings = retrainingSessions.filter(
    (s) => normalizeReTrainingStatus(s.status) === 'finalizat',
  ).length;

  const premiiValue =
    latestMajorarePct != null
      ? formatCoeficientSalarial(latestMajorarePct)
      : evalHistory.length > 0
        ? `${evalHistory.length}`
        : '—';

  const premiiHint =
    latestMajorarePct != null
      ? evalHistory.length > 1
        ? `${evalHistory.length} evaluări`
        : 'ultima majorare'
      : evalHistory.length > 0
        ? 'evaluări'
        : undefined;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <StatTile
        area="training"
        label="Instruire"
        value={trainingReport ? `${trainingReport.progressPercent}%` : '—'}
        hint={trainingFinished ? 'finalizată' : trainingReport ? 'în curs' : undefined}
      />
      <StatTile
        area="certificate"
        label="Certificat"
        value={certificate ? 'Emis' : '—'}
        hint={certificate ? 'valid' : undefined}
      />
      <StatTile
        area="retraining"
        label="Re-instruiri"
        value={retrainingSessions.length > 0 ? retrainingSessions.length : '—'}
        hint={completedRetrainings > 0 ? `${completedRetrainings} finalizate` : undefined}
      />
      <StatTile
        area="evaluation"
        label="Premii"
        value={premiiValue}
        hint={premiiHint}
      />
    </div>
  );
}

export function EmployeeProfileCollapsedSummary({
  email,
  functie,
  supervisorName,
  mentorName,
  trainingReport,
  trainingFinished,
  certificate,
  retrainingSessions,
  evalHistory,
  latestMajorarePct,
  achievementsOnly = false,
}: EmployeeProfileCollapsedSummaryProps) {
  if (achievementsOnly) {
    return (
      <AchievementTiles
        trainingReport={trainingReport}
        trainingFinished={trainingFinished}
        certificate={certificate}
        retrainingSessions={retrainingSessions}
        evalHistory={evalHistory}
        latestMajorarePct={latestMajorarePct}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoRow label="Email" value={email ?? '—'} />
        <InfoRow label="Funcție" value={functie ?? 'Angajat artGRANIT'} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <RelationCell label="Supervizor" name={supervisorName} />
        <RelationCell label="Mentor instruire" name={mentorName} />
      </div>
    </div>
  );
}
