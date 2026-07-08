import { useMemo } from 'react';
import { CompetencyMatrix } from '@/components/competency/CompetencyMatrix';
import { CompetencyLevelGuide } from '@/components/competency/CompetencyLevelGuide';
import { DesignerCompetencySummary } from '@/components/competency/DesignerCompetencySummary';
import { useProgress } from '@/hooks/useProgress';
import { useCanSelectStagiar } from '@/context/StagiarContext';
import { useAuth } from '@/hooks/useAuth';
import { useStagiarId } from '@/hooks/useStagiarId';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { TraineeSelector } from '@/components/mentor/TraineeSelector';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { formatEvaluationRoDate } from '@/lib/evaluationDisplay';
import { canViewSalaryCoefficient } from '@/lib/roles';
import { Card } from '@/components/ui/Card';
import type { DesignerCompetencyLevel } from '@/types';
import { DesktopPageHeader } from '@/components/layout/DesktopPageHeader';
import { DesktopPageIntro } from '@/components/layout/DesktopPageIntro';

export function CompetencyPage() {
  const { progress } = useProgress();
  const { user } = useAuth();
  const canSelect = useCanSelectStagiar();
  const stagiarId = useStagiarId();
  const { evaluations } = useHrPerformance();
  const showSalary = canViewSalaryCoefficient(user);

  const targetUserId = stagiarId ?? user?.id;

  const userEvaluations = useMemo(
    () => (targetUserId ? evaluations.filter((e) => e.angajatId === targetUserId) : []),
    [targetUserId, evaluations],
  );

  const evalContext = useMemo(() => {
    if (!targetUserId) return null;

    const completed = userEvaluations
      .filter((e) => e.status === 'evaluat' && e.competencyResult)
      .sort((a, b) =>
        (a.dataEvaluare ?? a.updatedAt).localeCompare(b.dataEvaluare ?? b.updatedAt),
      );
    const latestCycle = completed.at(-1);
    const current = hrPerformanceStore.getCurrentEvaluation(targetUserId);
    const evalInProgress =
      current?.status === 'in_curs' || current?.status === 'intarziat';
    const nextEvaluationDate =
      current && current.status !== 'evaluat'
        ? showSalary || evalInProgress
          ? current.termenReevaluare
          : undefined
        : undefined;

    return {
      latestCycle,
      outcome: latestCycle?.competencyResult,
      nextEvaluationDate,
      activeLevel: (latestCycle?.competencyResult?.nivel ??
        hrPerformanceStore.getProfile(targetUserId)?.nivelCompetenta) as
        | DesignerCompetencyLevel
        | undefined,
    };
  }, [targetUserId, userEvaluations, showSalary]);

  const profile = targetUserId ? hrPerformanceStore.getProfile(targetUserId) : undefined;

  return (
    <div className="space-y-6">
      {canSelect && <TraineeSelector />}
      <div>
        <DesktopPageHeader>
          <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Matrice Competențe</h1>
        </DesktopPageHeader>
        <DesktopPageIntro>
          Inginer proiectant — Proliner & AutoCAD · evaluare tri-lunară și progres instruire
        </DesktopPageIntro>
      </div>

      {!evalContext?.latestCycle &&
        (profile?.nivelCompetenta ? (
          <Card>
            <p className="text-sm text-corporate-muted">
              Nivel competență înregistrat: Nivel {profile.nivelCompetenta}
              {profile.scorCompetentaTotal != null && ` · Total ${profile.scorCompetentaTotal}/40`}
              {showSalary && profile.coeficientSalarialPercent != null && (
                <> · Coeficient salarial: {profile.coeficientSalarialPercent === 0 ? '0%' : `+${profile.coeficientSalarialPercent}%`}</>
              )}
            </p>
            {evalContext?.nextEvaluationDate && (
              <p className="text-sm text-corporate-gold font-medium mt-2">
                Termen evaluare curentă: {formatEvaluationRoDate(evalContext.nextEvaluationDate)}
              </p>
            )}
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-corporate-muted">
              Matricea oficială se completează în ciclul de evaluare tri-lunară (auto-evaluare → supervizor → HR).
            </p>
          </Card>
        ))}

      {showSalary && evalContext?.outcome && evalContext.latestCycle && (
        <Card>
          <h2 className="text-lg font-semibold text-corporate-dark mb-3">
            Matrice criterii — ultima evaluare
          </h2>
          <DesignerCompetencySummary
            scores={evalContext.outcome.scores}
            outcome={evalContext.outcome}
            showSalaryCoefficient
            hideCriteriaTable={false}
          />
        </Card>
      )}

      <section>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Niveluri de competență</h2>
        <p className="text-sm text-corporate-muted mb-3">
          {evalContext?.activeLevel
            ? 'Nivelul evidențiat corespunde rezultatului ultimei evaluări tri-lunare validate de HR.'
            : 'Referință pentru cele 4 niveluri — se actualizează după fiecare evaluare finalizată.'}
        </p>
        <CompetencyLevelGuide activeLevel={evalContext?.activeLevel} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Progres instruire (Săpt. II & IV)</h2>
        <p className="text-sm text-corporate-muted mb-4">
          Indicatori din feedback mentor în perioada de instruire inițială
        </p>
        {progress && progress.feedbacks.length === 0 ? (
          <Card>
            <p className="text-sm text-corporate-muted">
              Se completează după feedback-urile de la Săptămâna II și IV.
            </p>
          </Card>
        ) : (
          <CompetencyMatrix />
        )}
      </section>
    </div>
  );
}
