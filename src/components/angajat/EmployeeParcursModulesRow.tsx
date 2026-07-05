import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ExpandableModuleRow } from '@/components/ui/ExpandableModuleRow';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { EmployeeCompletedTrainingBody } from '@/components/angajat/EmployeeCompletedTrainingBody';
import { EmployeeActiveTrainingBody } from '@/components/angajat/EmployeeActiveTrainingBody';
import { EmployeeCompletedRetrainingBody } from '@/components/angajat/EmployeeCompletedRetrainingBody';
import { EmployeeEvaluationHistory } from '@/components/angajat/EmployeeEvaluationHistory';
import { ReTrainingPlanProgressSection } from '@/components/training/ReTrainingPlanProgressSection';
import { formatEvaluationShortDate } from '@/lib/evaluationDisplay';
import { getDepartmentById, type DepartmentId } from '@/data/departments';
import type { TraineeHrReport } from '@/lib/hrReport';
import type { EvaluationCycle, ReTrainingSession, User } from '@/types';

type ModuleDisplay = 'header' | 'body';
type ActiveModule = 'training' | 'retraining' | 'evaluation';

interface EmployeeParcursModulesRowProps {
  subjectId: string;
  isPreview: boolean;
  trainingReport?: TraineeHrReport | null;
  trainingFinished: boolean;
  enrollmentDepartmentId?: DepartmentId;
  assignedMentor?: User;
  activeRetrainings: ReTrainingSession[];
  completedRetrainings: ReTrainingSession[];
  completedEvaluations: EvaluationCycle[];
  currentEval?: EvaluationCycle;
  evalInProgress: boolean;
  evalActionable: boolean;
  receivedCompetencyTitle?: string;
  receivedCompetencyDate?: string;
  onOpenTrainingPlan: () => void;
  onOpenActiveRetrainingInPlan: (sessionId: string) => void;
  onOpenActiveEvaluation: () => void;
  /** Deschide modulul din parcurs (ex. din link acțiuni / URL) */
  expandModule?: ActiveModule | null;
}

const EXPAND_LABELS: Record<ActiveModule, string> = {
  training: 'Instruire inițială · program de 4 săptămâni',
  retraining: 'Re-instruire · sesiuni finalizate',
  evaluation: 'Evaluări tri-lunale finalizate',
};

function TrainingModulePanel({
  display,
  expanded,
  onExpandedChange,
  trainingReport,
  trainingFinished,
  enrollmentDepartmentId,
  assignedMentor,
  subjectId,
  onOpenTrainingPlan,
}: Pick<
  EmployeeParcursModulesRowProps,
  | 'trainingReport'
  | 'trainingFinished'
  | 'enrollmentDepartmentId'
  | 'assignedMentor'
  | 'subjectId'
  | 'onOpenTrainingPlan'
> & {
  display: ModuleDisplay;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
}) {
  const subtitle = trainingReport
    ? enrollmentDepartmentId
      ? `${getDepartmentById(enrollmentDepartmentId)?.label ?? '—'} · Mentor: ${assignedMentor?.name ?? '—'}`
      : `${trainingReport.completedDays}/${trainingReport.totalDays} zile`
    : 'Plan de 4 săptămâni la angajare';

  const body = trainingFinished ? (
    <EmployeeCompletedTrainingBody angajatId={subjectId} />
  ) : (
    <EmployeeActiveTrainingBody angajatId={subjectId} onOpenPlan={onOpenTrainingPlan} />
  );

  if (display === 'body') {
    return body;
  }

  return (
    <ProfessionalPanel
      variant={trainingFinished ? 'training-success' : 'training'}
      icon={trainingFinished ? 'certificate' : 'training'}
      eyebrow="Instruire inițială · 4 săpt."
      title={trainingFinished ? 'Instruire finalizată' : 'Plan de instruire'}
      subtitle={subtitle}
      collapsible
      expanded={expanded}
      onToggle={() => onExpandedChange(!expanded)}
      bodyDetached
      headerTile
      toggleLabels={{
        expanded: 'Restrânge',
        collapsed: trainingFinished ? 'Vezi parcursul finalizat' : 'Deschide planul activ',
      }}
      badge={
        trainingReport ? (
          <Badge variant={trainingFinished ? 'success' : 'default'}>
            {trainingFinished ? 'Finalizată' : `${trainingReport.progressPercent}%`}
          </Badge>
        ) : undefined
      }
    >
      {body}
    </ProfessionalPanel>
  );
}

function RetrainingModulePanel({
  display,
  expanded,
  onExpandedChange,
  activeRetrainings,
  completedRetrainings,
  subjectId,
  onOpenActiveRetrainingInPlan,
}: Pick<
  EmployeeParcursModulesRowProps,
  | 'activeRetrainings'
  | 'completedRetrainings'
  | 'subjectId'
  | 'onOpenActiveRetrainingInPlan'
> & {
  display: ModuleDisplay;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
}) {
  const hasCompleted = completedRetrainings.length > 0;
  const hasActive = activeRetrainings.length > 0;
  const [expandedActiveId, setExpandedActiveId] = useState<string | null>(null);

  if (!hasCompleted && !hasActive) return null;

  const body = (
    <div className="space-y-4">
      {hasActive &&
        activeRetrainings.map((session) => (
          <ReTrainingPlanProgressSection
            key={session.id}
            session={session}
            angajatId={subjectId}
            expanded={expandedActiveId === session.id}
            onExpandedChange={(next) => setExpandedActiveId(next ? session.id : null)}
            headerAction={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onOpenActiveRetrainingInPlan(session.id)}
              >
                Plan complet →
              </Button>
            }
          />
        ))}
      {hasCompleted && (
        <EmployeeCompletedRetrainingBody angajatId={subjectId} sessions={completedRetrainings} />
      )}
    </div>
  );

  if (display === 'body') {
    return body;
  }

  return (
    <ProfessionalPanel
      variant={hasCompleted && !hasActive ? 'retraining-success' : 'retraining'}
      icon="activity"
      eyebrow="Re-instruire"
      title={hasCompleted ? 'Re-instruire finalizată' : 'Re-instruire în curs'}
      subtitle={
        hasCompleted
          ? `${completedRetrainings.length} finalizate${hasActive ? ` · ${activeRetrainings.length} active în plan` : ''}`
          : `${activeRetrainings.length} în curs — Plan instruire`
      }
      collapsible
      expanded={expanded}
      onToggle={() => onExpandedChange(!expanded)}
      bodyDetached
      headerTile
      toggleLabels={{
        expanded: 'Restrânge',
        collapsed: hasCompleted ? 'Vezi re-instruirile finalizate' : 'Deschide în plan',
      }}
      badge={
        <span className="text-[10px] font-medium text-orange-900/80 tabular-nums">
          {completedRetrainings.length || activeRetrainings.length}
        </span>
      }
    >
      {body}
    </ProfessionalPanel>
  );
}

function EvaluationModulePanel({
  display,
  expanded,
  onExpandedChange,
  trainingFinished,
  completedEvaluations,
  currentEval,
  evalInProgress,
  receivedCompetencyTitle,
  receivedCompetencyDate,
  onOpenActiveEvaluation,
}: Pick<
  EmployeeParcursModulesRowProps,
  | 'trainingFinished'
  | 'completedEvaluations'
  | 'currentEval'
  | 'evalInProgress'
  | 'evalActionable'
  | 'receivedCompetencyTitle'
  | 'receivedCompetencyDate'
  | 'onOpenActiveEvaluation'
> & {
  display: ModuleDisplay;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
}) {
  const hasCompleted = completedEvaluations.some((e) => e.status === 'evaluat');
  const hasActive = evalInProgress && !!currentEval;
  const [activeEvalExpanded, setActiveEvalExpanded] = useState(false);

  if (!hasCompleted && !hasActive && !trainingFinished) {
    if (display === 'body') return null;
  }

  const body = (
    <div className="space-y-3">
      {hasActive && currentEval && (
        <ProfessionalPanel
          variant="evaluation"
          icon="evaluation"
          eyebrow="Evaluare activă"
          title="Flux tri-lunar în desfășurare"
          subtitle="Auto-evaluare, validare supervizor și confirmare HR"
          collapsible
          expanded={activeEvalExpanded}
          onToggle={() => setActiveEvalExpanded((v) => !v)}
          toggleLabels={{
            expanded: 'Restrânge detaliile',
            collapsed: 'Deschide detaliile evaluării',
          }}
          headerAction={
            <Button type="button" variant="secondary" size="sm" onClick={onOpenActiveEvaluation}>
              Flux complet →
            </Button>
          }
          collapsedPeek={
            <p className="text-sm text-corporate-muted">
              Termen: {formatEvaluationShortDate(currentEval.termenReevaluare)}
            </p>
          }
        >
          {activeEvalExpanded && (
            <p className="text-sm text-corporate-muted leading-relaxed">
              Evaluarea este activă în pagina Evaluări. Deschideți fluxul complet pentru pașii curenți
              (auto-evaluare, validare supervizor, confirmare HR).
            </p>
          )}
        </ProfessionalPanel>
      )}
      {hasCompleted && (
        <>
          <EmployeeEvaluationHistory
            cycles={completedEvaluations}
            nextEvaluationDate={
              currentEval && currentEval.status !== 'evaluat'
                ? currentEval.termenReevaluare
                : undefined
            }
          />
          {receivedCompetencyTitle && receivedCompetencyDate && (
            <p className="text-xs text-corporate-muted">
              Ultima evaluare: {receivedCompetencyTitle} ·{' '}
              {formatEvaluationShortDate(receivedCompetencyDate)}
            </p>
          )}
        </>
      )}
      {!hasCompleted && !hasActive && trainingFinished && (
        <p className="text-sm text-corporate-muted">
          Evaluarea tri-lunară se programează după emiterea certificatului de instruire.
        </p>
      )}
    </div>
  );

  if (display === 'body') {
    return body;
  }

  return (
    <ProfessionalPanel
      variant="evaluation"
      icon="evaluation"
      eyebrow="Performanță HR"
      title={hasActive ? 'Evaluare în curs' : 'Evaluare tri\u2011lunară'}
      subtitle={
        hasActive
          ? 'Flux activ în pagina Evaluări'
          : hasCompleted
            ? `${completedEvaluations.filter((e) => e.status === 'evaluat').length} evaluări în dosar`
            : 'Se programează după certificat'
      }
      collapsible
      expanded={expanded}
      onToggle={() => onExpandedChange(!expanded)}
      bodyDetached
      headerTile
      toggleLabels={{
        expanded: 'Restrânge',
        collapsed: hasActive ? 'Deschide evaluarea activă' : 'Vezi evaluările finalizate',
      }}
      badge={
        hasActive ? (
          <Badge variant={currentEval?.status === 'intarziat' ? 'warning' : 'default'}>În curs</Badge>
        ) : receivedCompetencyTitle ? (
          <span className="text-[9px] font-medium text-indigo-800/90 line-clamp-1 max-w-[5.5rem] shrink-0">
            {receivedCompetencyTitle}
          </span>
        ) : undefined
      }
    >
      {body}
    </ProfessionalPanel>
  );
}

/** Instruire · Re-instruire · Evaluare — arhivă în panou; active în Plan / Evaluări */
export function EmployeeParcursModulesRow(props: EmployeeParcursModulesRowProps) {
  const [active, setActive] = useState<ActiveModule | null>(null);

  useEffect(() => {
    if (props.expandModule) setActive(props.expandModule);
  }, [props.expandModule]);

  const showTraining = !!props.trainingReport || !props.trainingFinished;
  const showRetraining =
    props.completedRetrainings.length > 0 || props.activeRetrainings.length > 0;
  const showEvaluation =
    !!props.trainingReport ||
    props.trainingFinished ||
    props.completedEvaluations.length > 0 ||
    !!props.currentEval;

  const handleTrainingToggle = (open: boolean) => {
    setActive(open ? 'training' : null);
  };

  const handleRetrainingToggle = (open: boolean) => {
    setActive(open ? 'retraining' : null);
  };

  const handleEvaluationToggle = (open: boolean) => {
    setActive(open ? 'evaluation' : null);
  };

  const modules: {
    id: ActiveModule;
    header: React.ReactNode;
    body: React.ReactNode | null;
  }[] = [];

  if (showTraining) {
    modules.push({
      id: 'training',
      header: (
        <TrainingModulePanel
          display="header"
          expanded={active === 'training'}
          onExpandedChange={handleTrainingToggle}
          trainingReport={props.trainingReport}
          trainingFinished={props.trainingFinished}
          enrollmentDepartmentId={props.enrollmentDepartmentId}
          assignedMentor={props.assignedMentor}
          subjectId={props.subjectId}
          onOpenTrainingPlan={props.onOpenTrainingPlan}
        />
      ),
      body: (
        <TrainingModulePanel
          display="body"
          expanded
          onExpandedChange={() => setActive(null)}
          trainingReport={props.trainingReport}
          trainingFinished={props.trainingFinished}
          enrollmentDepartmentId={props.enrollmentDepartmentId}
          assignedMentor={props.assignedMentor}
          subjectId={props.subjectId}
          onOpenTrainingPlan={props.onOpenTrainingPlan}
        />
      ),
    });
  }

  if (showRetraining) {
    modules.push({
      id: 'retraining',
      header: (
        <RetrainingModulePanel
          display="header"
          expanded={active === 'retraining'}
          onExpandedChange={handleRetrainingToggle}
          activeRetrainings={props.activeRetrainings}
          completedRetrainings={props.completedRetrainings}
          subjectId={props.subjectId}
          onOpenActiveRetrainingInPlan={props.onOpenActiveRetrainingInPlan}
        />
      ),
      body: (
        <RetrainingModulePanel
          display="body"
          expanded
          onExpandedChange={() => setActive(null)}
          activeRetrainings={props.activeRetrainings}
          completedRetrainings={props.completedRetrainings}
          subjectId={props.subjectId}
          onOpenActiveRetrainingInPlan={props.onOpenActiveRetrainingInPlan}
        />
      ),
    });
  }

  if (showEvaluation) {
    modules.push({
      id: 'evaluation',
      header: (
        <EvaluationModulePanel
          display="header"
          expanded={active === 'evaluation'}
          onExpandedChange={handleEvaluationToggle}
          trainingFinished={props.trainingFinished}
          completedEvaluations={props.completedEvaluations}
          currentEval={props.currentEval}
          evalInProgress={props.evalInProgress}
          evalActionable={props.evalActionable}
          receivedCompetencyTitle={props.receivedCompetencyTitle}
          receivedCompetencyDate={props.receivedCompetencyDate}
          onOpenActiveEvaluation={props.onOpenActiveEvaluation}
        />
      ),
      body: (
        <EvaluationModulePanel
          display="body"
          expanded
          onExpandedChange={() => setActive(null)}
          trainingFinished={props.trainingFinished}
          completedEvaluations={props.completedEvaluations}
          currentEval={props.currentEval}
          evalInProgress={props.evalInProgress}
          evalActionable={props.evalActionable}
          receivedCompetencyTitle={props.receivedCompetencyTitle}
          receivedCompetencyDate={props.receivedCompetencyDate}
          onOpenActiveEvaluation={props.onOpenActiveEvaluation}
        />
      ),
    });
  }

  if (!showTraining && !showRetraining && !showEvaluation) return null;

  const activeIndex = active !== null ? modules.findIndex((m) => m.id === active) : null;
  const activeModule = active !== null ? modules.find((m) => m.id === active) : null;

  return (
    <ExpandableModuleRow
      columnCount={modules.length}
      activeColumnIndex={activeIndex !== null && activeIndex >= 0 ? activeIndex : null}
      headers={modules.map((m) => m.header)}
      expandedContent={activeModule?.body ?? null}
      expandLabel={active ? EXPAND_LABELS[active] : undefined}
    />
  );
}
