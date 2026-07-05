import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ReTrainingPlanProgressSection } from '@/components/training/ReTrainingPlanProgressSection';
import { useTrainingSystemVersion } from '@/hooks/useTrainingSystemVersion';
import { sortReTrainingSessionsNewestFirst } from '@/lib/errorReTrainingDisplay';
import { normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { trainingSystemStore } from '@/lib/trainingSystemStore';

interface ReTrainingPlanSectionProps {
  angajatId: string;
  /** Doar sesiuni în curs — finalizate apar în Panou Angajat */
  activeOnly?: boolean;
}

export function retrainSessionDomId(sessionId: string): string {
  return `retrain-session-${sessionId}`;
}

export function ReTrainingPlanSection({ angajatId, activeOnly = false }: ReTrainingPlanSectionProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const version = useTrainingSystemVersion();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sessions = useMemo(
    () => {
      const all = sortReTrainingSessionsNewestFirst(
        trainingSystemStore.getReTrainingSessions({ angajatId }),
      );
      if (!activeOnly) return all;
      return all.filter((s) => normalizeReTrainingStatus(s.status) !== 'finalizat');
    },
    [angajatId, version, activeOnly],
  );

  const focusRetrain = searchParams.get('retrain');

  useEffect(() => {
    if (!focusRetrain || expandedId === focusRetrain) return;
    const el = document.getElementById(retrainSessionDomId(focusRetrain));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusRetrain, expandedId, sessions]);

  const toggleExpanded = (sessionId: string, next: boolean) => {
    setExpandedId(next ? sessionId : null);
    const params = new URLSearchParams(searchParams);
    if (next) {
      params.set('retrain', sessionId);
    } else if (params.get('retrain') === sessionId) {
      params.delete('retrain');
    }
    setSearchParams(params, { replace: true });
  };

  if (sessions.length === 0) return null;

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const live = trainingSystemStore.getSessionById(session.id) ?? session;
        const isFinalized = normalizeReTrainingStatus(live.status) === 'finalizat';
        const expanded = expandedId === session.id;
        const highlighted = focusRetrain === session.id && !expanded;

        return (
          <div
            key={session.id}
            id={retrainSessionDomId(session.id)}
            className={
              highlighted
                ? 'rounded-xl ring-2 ring-orange-400 ring-offset-2 transition-shadow'
                : undefined
            }
          >
            <ReTrainingPlanProgressSection
              session={session}
              angajatId={angajatId}
              expanded={expanded}
              onExpandedChange={(next) => toggleExpanded(session.id, next)}
              headerAction={
                <Button
                  type="button"
                  variant={isFinalized ? 'primary' : 'secondary'}
                  size="sm"
                  className={isFinalized ? 'bg-orange-600 hover:bg-orange-700 border-orange-600' : ''}
                  onClick={() => toggleExpanded(session.id, !expanded)}
                >
                  {isFinalized
                    ? expanded
                      ? 'Închide lecția'
                      : 'Instruire de succes ✓'
                    : expanded
                      ? 'Închide lecția'
                      : 'Deschide lecția →'}
                </Button>
              }
            />
          </div>
        );
      })}
    </div>
  );
}
