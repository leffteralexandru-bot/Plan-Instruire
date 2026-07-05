import { type ReactNode, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CertificateModal } from '@/components/certificate/CertificateModal';
import { formatEvaluationShortDate, formatEvaluationRoDate } from '@/lib/evaluationDisplay';
import { formatCoeficientSalarial } from '@/lib/competencyScoring';
import { evaluationOrdinalLabel } from '@/lib/evaluationDisplay';
import type { CompletedEvaluationSummary } from '@/lib/evaluationDisplay';
import {
  RE_TRAINING_STATUS_LABELS,
  normalizeReTrainingStatus,
} from '@/lib/reTrainingWorkflow';
import { PROGRAM_AREA_THEMES, type ProgramArea } from '@/lib/programAreaTheme';
import type { Certificate, ReTrainingSession, User } from '@/types';
import type { TraineeHrReport } from '@/lib/hrReport';

function SummaryStatCard({
  area,
  label,
  value,
  valueClassName = 'text-corporate-dark',
}: {
  area: ProgramArea;
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  const theme = PROGRAM_AREA_THEMES[area];
  return (
    <div className={`rounded-lg border px-3 py-2.5 text-center ${theme.summaryCard}`}>
      <p className={`text-[10px] uppercase tracking-wide ${theme.summaryLabel}`}>{label}</p>
      <p className={`text-lg font-semibold tabular-nums mt-0.5 ${valueClassName}`}>{value}</p>
    </div>
  );
}

function AchievementBlock({
  title,
  children,
  empty,
  area,
}: {
  title: string;
  children: ReactNode;
  empty?: string;
  area: ProgramArea;
}) {
  const theme = PROGRAM_AREA_THEMES[area];
  return (
    <div className={`rounded-xl border overflow-hidden ${theme.blockShell}`}>
      <div className={`h-1 ${theme.accentBar}`} />
      <div className={`px-4 py-2.5 border-b ${theme.blockHeader}`}>
        <h4 className={`text-xs font-semibold uppercase tracking-wide ${theme.blockTitle}`}>
          {title}
        </h4>
      </div>
      <div className={`p-4 ${theme.blockBody}`}>
        {empty ? <p className="text-sm text-corporate-muted italic">{empty}</p> : children}
      </div>
    </div>
  );
}

interface EmployeeProfileAchievementsSectionProps {
  subjectId: string;
  trainingReport?: TraineeHrReport | null;
  trainingFinished: boolean;
  departmentLabel?: string;
  mentorName?: string;
  certificate?: Certificate;
  retrainingSessions: ReTrainingSession[];
  users: User[];
  evalHistory: CompletedEvaluationSummary[];
  evaluations: { id: string; competencyResult?: { coeficientSalarialPercent: number } }[];
  /** Detaliile pe blocuri (sub rezumat) — implicit restrânse */
  defaultDetailsExpanded?: boolean;
}

export function EmployeeProfileAchievementsSection({
  subjectId,
  trainingReport,
  trainingFinished,
  departmentLabel,
  mentorName,
  certificate,
  retrainingSessions,
  users,
  evalHistory,
  evaluations,
  defaultDetailsExpanded = true,
}: EmployeeProfileAchievementsSectionProps) {
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(defaultDetailsExpanded);

  const completedRetrainings = useMemo(
    () =>
      retrainingSessions.filter((s) => normalizeReTrainingStatus(s.status) === 'finalizat'),
    [retrainingSessions],
  );
  const activeRetrainings = useMemo(
    () =>
      retrainingSessions.filter((s) => normalizeReTrainingStatus(s.status) !== 'finalizat'),
    [retrainingSessions],
  );

  const evalHistoryNewestFirst = [...evalHistory].reverse();
  const totalMajorari = evalHistory.length;
  const latestMajorare = evalHistory.at(-1);
  const latestMajorarePct = latestMajorare
    ? evaluations.find((e) => e.id === latestMajorare.id)?.competencyResult
        ?.coeficientSalarialPercent
    : undefined;

  const resolveTrainer = (session: ReTrainingSession) =>
    users.find((u) => u.id === (session.trainerId ?? session.mentorId))?.name;

  const retrainingDate = (session: ReTrainingSession) =>
    session.hrConfirmedAt ?? session.traineeCompletedAt ?? session.supervisorConfirmedAt;

  const trainingTheme = PROGRAM_AREA_THEMES.training;
  const certificateTheme = PROGRAM_AREA_THEMES.certificate;
  const retrainingTheme = PROGRAM_AREA_THEMES.retraining;
  const evaluationTheme = PROGRAM_AREA_THEMES.evaluation;

  const hasAnyContent =
    trainingReport ||
    certificate ||
    retrainingSessions.length > 0 ||
    evalHistory.length > 0;

  if (!hasAnyContent) {
    return (
      <div className="rounded-xl border border-dashed border-corporate-border bg-corporate-surface/30 px-4 py-6 text-sm text-corporate-muted text-center">
        Înregistrările de instruire, certificate și premii vor apărea aici pe măsură ce parcurgeți
        programul artGRANIT.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <SummaryStatCard
          area="training"
          label="Instruire inițială"
          value={trainingReport ? `${trainingReport.progressPercent}%` : '—'}
        />
        <SummaryStatCard
          area="certificate"
          label="Certificate"
          value={certificate ? '1' : '0'}
        />
        <SummaryStatCard
          area="retraining"
          label="Re-instruiri"
          value={completedRetrainings.length}
        />
        <SummaryStatCard
          area="evaluation"
          label="Premii evaluare"
          value={
            latestMajorarePct != null
              ? formatCoeficientSalarial(latestMajorarePct)
              : totalMajorari > 0
                ? totalMajorari
                : '—'
          }
          valueClassName="text-indigo-900"
        />
      </div>

      {hasAnyContent && (
        <div className="mb-4">
          <button
            type="button"
            className="text-xs font-medium text-corporate-gold hover:underline"
            onClick={() => setDetailsExpanded((v) => !v)}
          >
            {detailsExpanded ? 'Restrânge detaliile ↑' : 'Vezi detalii complete pe categorii →'}
          </button>
        </div>
      )}

      {detailsExpanded && (
      <div className="grid gap-4 lg:grid-cols-2">
        <AchievementBlock
          area="training"
          title="Instruire inițială · 4 săptămâni"
          empty={!trainingReport ? 'Nicio înscriere în planul de instruire.' : undefined}
        >
          {trainingReport && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-semibold ${trainingTheme.blockTitle}`}>
                    {trainingFinished ? 'Program finalizat cu succes' : 'Program în desfășurare'}
                  </p>
                  <p className="text-xs text-corporate-muted mt-1">
                    {departmentLabel && `${departmentLabel} · `}
                    {trainingReport.completedDays}/{trainingReport.totalDays} zile finalizate
                    {mentorName && ` · Mentor: ${mentorName}`}
                  </p>
                  {trainingReport.programStart && (
                    <p className="text-xs text-corporate-muted mt-0.5">
                      Start: {formatEvaluationShortDate(trainingReport.programStart)}
                    </p>
                  )}
                </div>
                <Badge variant={trainingFinished ? 'success' : 'default'}>
                  {trainingFinished ? 'Finalizată' : `${trainingReport.progressPercent}%`}
                </Badge>
              </div>
              {!trainingFinished && (
                <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
                  <div
                    className={`h-full transition-all ${trainingTheme.progressBar}`}
                    style={{ width: `${trainingReport.progressPercent}%` }}
                  />
                </div>
              )}
              {trainingReport.quizScoreLabel && (
                <p className="text-xs text-corporate-muted">
                  Test teoretic: <span className="text-corporate-dark">{trainingReport.quizScoreLabel}</span>
                  {trainingReport.quizPassed === true && ' · Promovat'}
                </p>
              )}
            </div>
          )}
        </AchievementBlock>

        <AchievementBlock
          area="certificate"
          title="Certificate oficiale"
          empty={
            !certificate
              ? 'Certificatul se emite după finalizarea instruirii inițiale, de către mentor.'
              : undefined
          }
        >
          {certificate && (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${certificateTheme.blockTitle}`}>
                  Certificat instruire la angajare
                </p>
                <p className="text-xs text-corporate-muted mt-1">
                  Emis la {formatEvaluationRoDate(certificate.issuedAt)}
                  {certificate.certificateNumber && (
                    <> · Nr. {certificate.certificateNumber}</>
                  )}
                </p>
                {certificate.mentorName && (
                  <p className="text-xs text-corporate-muted mt-0.5">
                    Mentor emitent: {certificate.mentorName}
                  </p>
                )}
                {certificate.testScoreLabel && (
                  <p className="text-xs text-corporate-muted">
                    Test: {certificate.testScoreLabel}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="border-emerald-200 text-emerald-900 hover:bg-emerald-50"
                onClick={() => setCertificateOpen(true)}
              >
                Vizualizare
              </Button>
            </div>
          )}
        </AchievementBlock>

        <AchievementBlock
          area="retraining"
          title="Re-instruiri"
          empty={
            retrainingSessions.length === 0
              ? 'Nicio re-instruire înregistrată în dosar.'
              : undefined
          }
        >
          {(activeRetrainings.length > 0 || completedRetrainings.length > 0) && (
            <ul className="space-y-2">
              {[...activeRetrainings, ...completedRetrainings].map((session) => {
                const status = normalizeReTrainingStatus(session.status);
                const date = retrainingDate(session);
                return (
                  <li
                    key={session.id}
                    className={`rounded-lg border px-3 py-2.5 ${retrainingTheme.itemShell}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${retrainingTheme.blockTitle}`}>
                          {session.titlu || session.topicTitle || 'Re-instruire tematică'}
                        </p>
                        <p className="text-xs text-corporate-muted mt-0.5 line-clamp-2">
                          {session.topicTitle && session.titlu !== session.topicTitle
                            ? session.topicTitle
                            : session.descriere}
                        </p>
                        {resolveTrainer(session) && (
                          <p className="text-[11px] text-corporate-muted mt-1">
                            Trainer: {resolveTrainer(session)}
                          </p>
                        )}
                      </div>
                      <Badge variant={status === 'finalizat' ? 'success' : 'warning'}>
                        {RE_TRAINING_STATUS_LABELS[status]}
                      </Badge>
                    </div>
                    {date && (
                      <p className="text-[11px] text-corporate-muted mt-1.5">
                        {status === 'finalizat' ? 'Finalizată' : 'Actualizat'}:{' '}
                        {formatEvaluationShortDate(date)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </AchievementBlock>

        <AchievementBlock
          area="evaluation"
          title="Premii și evaluări tri-lunale"
          empty={
            evalHistoryNewestFirst.length === 0
              ? 'Premiile (majorări salariale) se acordă după evaluările tri-lunale validate de HR.'
              : undefined
          }
        >
          {evalHistoryNewestFirst.length > 0 && (
            <ul className="space-y-2">
              {evalHistoryNewestFirst.map((item) => {
                const majorare = evaluations.find((e) => e.id === item.id)?.competencyResult
                  ?.coeficientSalarialPercent;
                return (
                  <li
                    key={item.id}
                    className={`rounded-lg border px-3 py-2.5 ${evaluationTheme.itemShell}`}
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className={`text-xs font-semibold ${evaluationTheme.blockTitle}`}>
                          {evaluationOrdinalLabel(item.ordinal)}
                        </p>
                        <p className="text-sm font-medium text-corporate-dark mt-0.5">
                          {item.nivelLabel} · Scor {item.total}/40
                        </p>
                        <p className="text-[11px] text-corporate-muted mt-0.5">
                          {item.date && formatEvaluationShortDate(item.date)}
                          {item.evaluatorName && ` · ${item.evaluatorName}`}
                        </p>
                      </div>
                      {majorare != null && (
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-indigo-700/80">Majorare</p>
                          <p className="text-sm font-semibold text-indigo-900">
                            {formatCoeficientSalarial(majorare)}
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AchievementBlock>
      </div>
      )}

      {certificate && (
        <CertificateModal
          certificate={certificate}
          angajatId={subjectId}
          open={certificateOpen}
          onClose={() => setCertificateOpen(false)}
        />
      )}
    </>
  );
}
