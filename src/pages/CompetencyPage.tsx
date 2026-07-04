import { useMemo } from 'react';
import { CompetencyMatrix } from '@/components/competency/CompetencyMatrix';
import { CompetencyLevelGuide } from '@/components/competency/CompetencyLevelGuide';
import { DesignerCompetencySummary } from '@/components/competency/DesignerCompetencySummary';
import { useProgress } from '@/hooks/useProgress';
import { useCanSelectStagiar } from '@/context/StagiarContext';
import { useAuth } from '@/hooks/useAuth';
import { useStagiarId } from '@/hooks/useStagiarId';
import { TraineeSelector } from '@/components/mentor/TraineeSelector';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { canViewSalaryCoefficient } from '@/lib/roles';
import { Card } from '@/components/ui/Card';

export function CompetencyPage() {
  const { progress } = useProgress();
  const { user } = useAuth();
  const canSelect = useCanSelectStagiar();
  const stagiarId = useStagiarId();
  const showSalary = canViewSalaryCoefficient(user);

  const targetUserId = stagiarId ?? user?.id;
  const latestOutcome = useMemo(() => {
    if (!targetUserId) return undefined;
    const evaluated = hrPerformanceStore
      .getEvaluations(targetUserId)
      .filter((e) => e.status === 'evaluat' && e.competencyResult)
      .sort((a, b) => (b.dataEvaluare ?? b.updatedAt).localeCompare(a.dataEvaluare ?? a.updatedAt));
    return evaluated[0]?.competencyResult;
  }, [targetUserId]);

  const profile = targetUserId ? hrPerformanceStore.getProfile(targetUserId) : undefined;

  return (
    <div className="space-y-6">
      {canSelect && <TraineeSelector />}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-corporate-dark">Matrice Competențe</h1>
        <p className="text-corporate-muted mt-1">
          Inginer proiectant — Proliner & AutoCAD · evaluare tri-lunară și progres instruire
        </p>
      </div>

      {latestOutcome ? (
        <Card>
          <h2 className="text-lg font-semibold text-corporate-dark mb-3">
            Evaluare competențe validată
          </h2>
          <DesignerCompetencySummary
            scores={latestOutcome.scores}
            outcome={latestOutcome}
            showSalaryCoefficient={showSalary}
          />
        </Card>
      ) : profile?.nivelCompetenta ? (
        <Card>
          <p className="text-sm text-corporate-muted">
            Nivel competență înregistrat: Nivel {profile.nivelCompetenta}
            {profile.scorCompetentaTotal != null && ` · Total ${profile.scorCompetentaTotal}/40`}
            {showSalary && profile.coeficientSalarialPercent != null && (
              <> · Coeficient salarial: {profile.coeficientSalarialPercent === 0 ? '0%' : `+${profile.coeficientSalarialPercent}%`}</>
            )}
          </p>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-corporate-muted">
            Matricea oficială se completează în ciclul de evaluare tri-lunar (auto-evaluare → supervizor → HR).
          </p>
        </Card>
      )}

      <section>
        <h2 className="text-lg font-semibold text-corporate-dark mb-3">Niveluri de competență</h2>
        <CompetencyLevelGuide />
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
