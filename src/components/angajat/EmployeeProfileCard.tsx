import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { EmployeeProfileAchievementsSection } from '@/components/angajat/EmployeeProfileAchievementsSection';
import { EmployeeProfileCollapsedSummary } from '@/components/angajat/EmployeeProfileCollapsedSummary';
import { EmployeeProfilePhoto } from '@/components/angajat/EmployeeProfilePhoto';
import { CompetencyLevelCornerBadge } from '@/components/competency/CompetencyLevelCornerBadge';
import { DESIGNER_COMPETENCY_LEVEL_PROFILES } from '@/data/designerCompetencyMatrix';
import { getDepartmentById, ingineriPath } from '@/data/departments';
import { EVALUATION_STATUS_LABELS } from '@/lib/hrPerformanceStore';
import {
  buildCompletedEvaluationSummaries,
  formatEvaluationRoDate,
  resolveEvaluationEvaluatorName,
} from '@/lib/evaluationDisplay';
import { formatCoeficientSalarial } from '@/lib/competencyScoring';
import type { DesignerCompetencyLevelProfile } from '@/data/designerCompetencyMatrix';
import type { TraineeHrReport } from '@/lib/hrReport';
import type { Certificate, EmployeeProfile, EvaluationCycle, ReTrainingSession, User } from '@/types';

function ProfileSection({
  title,
  children,
  className = '',
  collapsible = false,
  defaultExpanded = true,
  peek,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  peek?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!collapsible) {
    return (
      <section className={className}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-corporate-muted mb-3">
          {title}
        </h3>
        {children}
      </section>
    );
  }

  return (
    <section
      className={['rounded-xl border border-corporate-border/80 bg-white overflow-hidden', className].join(
        ' ',
      )}
    >
      <button
        type="button"
        className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-corporate-surface/30 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-corporate-muted">
            {title}
          </h3>
          {!expanded && peek ? <div className="mt-1.5 text-sm text-corporate-muted">{peek}</div> : null}
        </div>
      </button>
      {expanded ? (
        <div className="px-4 pb-4 border-t border-corporate-border/50">{children}</div>
      ) : null}
    </section>
  );
}

function ProfileDataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-corporate-border/50 last:border-0">
      <dt className="text-[11px] text-corporate-muted">{label}</dt>
      <dd className="text-sm font-medium text-corporate-dark">{value}</dd>
    </div>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-corporate-black text-white text-sm font-bold tabular-nums shadow-sm">
      {level}
    </span>
  );
}

interface EmployeeProfileCardProps {
  profileDisplayName: string;
  email: string;
  profile?: EmployeeProfile;
  supervisor?: User;
  mentor?: User;
  photoUrl?: string;
  photoEditable: boolean;
  onPhotoChange: (photoUrl: string | undefined) => void | Promise<void>;
  isMentor: boolean;
  isPreview: boolean;
  currentEval?: EvaluationCycle;
  trainingFinished: boolean;
  evaluations: EvaluationCycle[];
  subjectId: string;
  lastCompletedEvalCycle?: EvaluationCycle;
  competencyLevel?: number;
  competencyTitle?: string;
  competencyDate?: string;
  trainingReport?: TraineeHrReport | null;
  departmentLabel?: string;
  certificate?: Certificate;
  retrainingSessions?: ReTrainingSession[];
  users?: User[];
}

export function EmployeeProfileCard({
  profileDisplayName,
  email,
  profile,
  supervisor,
  mentor,
  photoUrl,
  photoEditable,
  onPhotoChange,
  isMentor,
  isPreview,
  currentEval,
  trainingFinished,
  evaluations,
  subjectId,
  lastCompletedEvalCycle,
  competencyLevel,
  competencyTitle,
  competencyDate,
  trainingReport,
  departmentLabel,
  certificate,
  retrainingSessions = [],
  users = [],
}: EmployeeProfileCardProps) {
  const levelProfile: DesignerCompetencyLevelProfile | undefined = competencyLevel
    ? DESIGNER_COMPETENCY_LEVEL_PROFILES.find((p) => p.level === competencyLevel)
    : undefined;

  const currentOutcome = lastCompletedEvalCycle?.competencyResult;
  const evalHistory = buildCompletedEvaluationSummaries(
    evaluations.filter((e) => e.angajatId === subjectId),
  );

  const trainingStatus =
    profile?.tipAngajat === 'incepator'
      ? 'În program de instruire'
      : 'Angajat confirmat';

  const nextEvalDate =
    currentEval &&
    (currentEval.status === 'planificat' ||
      currentEval.status === 'in_curs' ||
      currentEval.status === 'intarziat')
      ? currentEval.termenReevaluare
      : undefined;

  const evalStatusLabel =
    currentEval &&
    (currentEval.status === 'in_curs' || currentEval.status === 'intarziat')
      ? EVALUATION_STATUS_LABELS[currentEval.status]
      : undefined;
  const evalStatusUrgent = currentEval?.status === 'intarziat';

  const [profileExpanded, setProfileExpanded] = useState(false);

  const latestMajorarePct = evalHistory.at(-1)
    ? evaluations.find((e) => e.id === evalHistory.at(-1)!.id)?.competencyResult
        ?.coeficientSalarialPercent
    : undefined;

  const collapsedSummaryProps = {
    email,
    functie: profile?.functie ?? 'Angajat artGRANIT',
    supervisorName: supervisor?.name,
    mentorName: mentor?.name,
    trainingReport,
    trainingFinished,
    certificate,
    retrainingSessions,
    evalHistory,
    latestMajorarePct,
  };

  const profileCollapsedPeek = <EmployeeProfileCollapsedSummary {...collapsedSummaryProps} />;

  const achievementsPeek = (
    <EmployeeProfileCollapsedSummary {...collapsedSummaryProps} achievementsOnly />
  );

  return (
    <ProfessionalPanel
      variant="profile"
      eyebrow="Dosar profesional"
      collapsible
      expanded={profileExpanded}
      onToggle={() => setProfileExpanded((v) => !v)}
      toggleLabels={{
        expanded: 'Restrânge profilul',
        collapsed: 'Deschide profilul complet',
      }}
      collapsedPeek={profileCollapsedPeek}
      headerIcon={
        <EmployeeProfilePhoto
          variant="header"
          displayName={profileDisplayName}
          photoUrl={photoUrl}
          editable={photoEditable}
          onPhotoChange={onPhotoChange}
        />
      }
      title={profileDisplayName}
      subtitle={profile?.functie ?? 'Angajat artGRANIT'}
      badge={
        <>
          {!profileExpanded && competencyLevel ? (
            <CompetencyLevelCornerBadge
              level={competencyLevel}
              title={competencyTitle ?? levelProfile?.title}
              evaluationStatus={evalStatusLabel}
              evaluationUrgent={evalStatusUrgent}
            />
          ) : evalStatusLabel ? (
            <Badge variant={evalStatusUrgent ? 'warning' : 'default'}>{evalStatusLabel}</Badge>
          ) : null}
          {isMentor && !isPreview && <Badge variant="default">Mentor temporar</Badge>}
        </>
      }
    >
      <div className="space-y-6">
        <p className="text-sm text-corporate-muted -mt-1">{email}</p>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <ProfileSection
              title="Date organizaționale"
              collapsible
              defaultExpanded={false}
              peek={
                <>
                  {profile ? (getDepartmentById(profile.departamentId)?.label ?? '—') : '—'}
                  {' · '}
                  {profile?.dataAngajarii ?? '—'}
                </>
              }
            >
              <dl className="rounded-xl border border-corporate-border/80 bg-corporate-surface/30 px-4 py-1">
                <ProfileDataRow
                  label="Departament"
                  value={profile ? (getDepartmentById(profile.departamentId)?.label ?? '—') : '—'}
                />
                <ProfileDataRow
                  label="Data angajării"
                  value={profile?.dataAngajarii ?? '—'}
                />
                <ProfileDataRow label="Statut parcurs" value={trainingStatus} />
              </dl>
            </ProfileSection>

            <ProfileSection
              title="Relații profesionale"
              collapsible
              defaultExpanded
              peek={
                <>
                  Supervizor: {supervisor?.name ?? '—'}
                  {mentor ? ` · Mentor: ${mentor.name}` : ''}
                </>
              }
            >
              <dl className="rounded-xl border border-corporate-border/80 bg-corporate-surface/30 px-4 py-1">
                <ProfileDataRow label="Supervizor" value={supervisor?.name ?? '—'} />
                {mentor && (
                  <ProfileDataRow label="Mentor instruire" value={mentor.name} />
                )}
              </dl>
            </ProfileSection>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <ProfileSection
              title="Nivel profesional actual"
              collapsible
              defaultExpanded
              peek={
                currentOutcome ? (
                  <>
                    {competencyTitle ?? currentOutcome.nivelLabel} · Scor {currentOutcome.total}/40
                    {currentOutcome.coeficientSalarialPercent != null && (
                      <>
                        {' '}
                        · Majorare{' '}
                        {formatCoeficientSalarial(currentOutcome.coeficientSalarialPercent)}
                      </>
                    )}
                  </>
                ) : (
                  trainingFinished
                    ? 'Evaluare tri-lunară în programare'
                    : 'Se stabilește după instruire și prima evaluare'
                )
              }
            >
              {currentOutcome && levelProfile ? (
                <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-white p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-wrap items-start gap-4">
                    <LevelBadge level={currentOutcome.nivel} />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-corporate-dark leading-snug">
                        {competencyTitle ?? currentOutcome.nivelLabel}
                      </p>
                      <p className="text-sm text-corporate-muted mt-1">{levelProfile.subtitle}</p>
                      {competencyDate && (
                        <p className="text-xs text-corporate-muted mt-2">
                          Validat la {formatEvaluationRoDate(competencyDate)}
                          {lastCompletedEvalCycle &&
                            resolveEvaluationEvaluatorName(lastCompletedEvalCycle) && (
                              <>
                                {' '}
                                · Supervizor:{' '}
                                <span className="text-corporate-dark">
                                  {resolveEvaluationEvaluatorName(lastCompletedEvalCycle)}
                                </span>
                              </>
                            )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-indigo-100">
                    <div className="rounded-lg bg-white/80 border border-indigo-100/80 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-corporate-muted">
                        Scor competență
                      </p>
                      <p className="text-lg font-semibold text-corporate-dark tabular-nums mt-0.5">
                        {currentOutcome.total}
                        <span className="text-sm font-normal text-corporate-muted"> / 40</span>
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/80 border border-indigo-100/80 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-corporate-muted">
                        Majorare evaluare
                      </p>
                      <p className="text-lg font-semibold text-emerald-800 tabular-nums mt-0.5">
                        {formatCoeficientSalarial(currentOutcome.coeficientSalarialPercent)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/80 border border-indigo-100/80 px-3 py-2.5 col-span-2 sm:col-span-1">
                      <p className="text-[10px] uppercase tracking-wide text-corporate-muted">
                        Autonomie
                      </p>
                      <p className="text-sm font-medium text-corporate-dark mt-1">
                        {levelProfile.autonomie}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-corporate-muted mt-3 leading-relaxed">
                    Potrivit pentru: {levelProfile.potrivitPentru}
                  </p>
                </div>
              ) : !trainingFinished ? (
                <div className="rounded-xl border border-dashed border-corporate-border bg-corporate-surface/40 px-4 py-5 text-sm text-corporate-muted leading-relaxed">
                  Nivelul profesional se stabilește după finalizarea instruirii inițiale și prima
                  evaluare tri-lunară validată de Resurse Umane.
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-5 text-sm text-corporate-muted leading-relaxed">
                  Evaluarea de competență este în curs de programare. Veți fi informat când începe
                  ciclul de auto-evaluare.
                  {nextEvalDate && (
                    <p className="mt-2 text-indigo-900 font-medium">
                      Termen estimat: {formatEvaluationRoDate(nextEvalDate)}
                    </p>
                  )}
                </div>
              )}
            </ProfileSection>

            {nextEvalDate && currentOutcome && (
              <p className="text-xs text-corporate-muted border-t border-corporate-border/60 pt-4">
                Următoarea reevaluare tri-lunară:{' '}
                <strong className="text-corporate-dark">
                  {formatEvaluationRoDate(nextEvalDate)}
                </strong>
              </p>
            )}

            {!isPreview && (
              <p className="text-xs">
                <Link
                  to={ingineriPath('/competente')}
                  className="text-corporate-gold hover:underline font-medium"
                >
                  Consultați matricea completă de competențe →
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-corporate-border/80 pt-4">
        <ProfileSection
          title="Instruiri, certificate și premii"
          collapsible
          defaultExpanded={false}
          peek={achievementsPeek}
        >
          <EmployeeProfileAchievementsSection
            subjectId={subjectId}
            trainingReport={trainingReport}
            trainingFinished={trainingFinished}
            departmentLabel={departmentLabel}
            mentorName={mentor?.name}
            certificate={certificate}
            retrainingSessions={retrainingSessions}
            users={users}
            evalHistory={evalHistory}
            evaluations={evaluations}
            defaultDetailsExpanded={false}
          />
        </ProfileSection>
        </div>
      </div>
    </ProfessionalPanel>
  );
}
