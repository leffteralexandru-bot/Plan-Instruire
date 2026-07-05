import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { EmployeeArchiveFolder } from '@/types';
import { ARCHIVE_FOLDER_DESCRIPTIONS, ARCHIVE_FOLDER_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { trainingSystemStore } from '@/lib/trainingSystemStore';
import { EmployeeEvaluationHistory } from '@/components/angajat/EmployeeEvaluationHistory';
import { useAuth } from '@/hooks/useAuth';
import { canAccessEmployeeArchive } from '@/lib/accessControl';
import { ingineriPath } from '@/data/departments';
import { RE_TRAINING_STATUS_LABELS, normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { userStore } from '@/lib/userStore';
import { PlanArchiveDayList } from '@/components/training/PlanArchiveDayList';

const FOLDERS: EmployeeArchiveFolder[] = [
  'documentatie_baza',
  'istoric_evaluari',
  'istoric_instruire',
];

interface EmployeeArchivePanelProps {
  angajatId: string;
  showPlanLink?: boolean;
  /** Panou pliabil — implicit în profilul angajat */
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

function ArchiveSummary({
  planDays,
  evalCount,
  retrainCount,
}: {
  planDays: number;
  evalCount: number;
  retrainCount: number;
}) {
  const parts: string[] = [];
  if (planDays > 0) parts.push(`${planDays} zile plan`);
  if (evalCount > 0) parts.push(`${evalCount} evaluări`);
  if (retrainCount > 0) parts.push(`${retrainCount} re-instruiri`);
  if (parts.length === 0) return <>Documentație, evaluări și istoric instruire</>;
  return <>{parts.join(' · ')}</>;
}

export function EmployeeArchivePanel({
  angajatId,
  showPlanLink,
  collapsible = false,
  defaultExpanded = true,
}: EmployeeArchivePanelProps) {
  const { user } = useAuth();
  const { evaluations, downloadDocument } = useHrPerformance();
  const [activeFolder, setActiveFolder] = useState<EmployeeArchiveFolder>('documentatie_baza');
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!canAccessEmployeeArchive(user, angajatId)) {
    return (
      <Card padding="sm">
        <p className="text-sm text-corporate-muted">Nu aveți acces la arhiva acestui angajat.</p>
      </Card>
    );
  }

  const planArchive = trainingSystemStore.getPlanArchive(angajatId);
  const docs = trainingSystemStore.getDocumentsByFolder(angajatId, activeFolder);
  const reTraining = trainingSystemStore.getReTrainingSessions({ angajatId });
  const employeeEvaluations = evaluations.filter((e) => e.angajatId === angajatId);
  const completedEvaluations = employeeEvaluations.filter(
    (e) => e.status === 'evaluat' && e.competencyResult,
  );
  const openEvalCycle = hrPerformanceStore.getCurrentEvaluation(angajatId);
  const nextEvaluationDate =
    openEvalCycle && openEvalCycle.status !== 'evaluat'
      ? openEvalCycle.termenReevaluare
      : undefined;

  const body = (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {FOLDERS.map((folder) => (
          <button
            key={folder}
            type="button"
            onClick={() => setActiveFolder(folder)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFolder === folder
                ? 'bg-corporate-gold text-white'
                : 'bg-corporate-surface text-corporate-dark hover:bg-corporate-border/50'
            }`}
          >
            {ARCHIVE_FOLDER_LABELS[folder]}
          </button>
        ))}
      </div>

      <p className="text-sm text-corporate-muted mb-4">{ARCHIVE_FOLDER_DESCRIPTIONS[activeFolder]}</p>

      {activeFolder === 'documentatie_baza' && (
        <div className="space-y-3">
          {!planArchive ? (
            <p className="text-sm text-corporate-muted italic">
              Documentația de bază se generează automat la finalizarea planului de instruire.
            </p>
          ) : (
            <>
              <p className="text-xs text-corporate-muted mb-3">
                Arhivat la {new Date(planArchive.completedAt).toLocaleDateString('ro-RO')} ·{' '}
                {planArchive.index.length} zile indexate · apăsați pe o zi pentru fișiere, video și poze
              </p>
              <PlanArchiveDayList
                angajatId={angajatId}
                entries={planArchive.index}
                maxHeight="max-h-96"
              />
            </>
          )}
        </div>
      )}

      {activeFolder === 'istoric_evaluari' && (
        <div className="space-y-4">
          {completedEvaluations.length > 0 ? (
            <EmployeeEvaluationHistory
              cycles={employeeEvaluations}
              nextEvaluationDate={nextEvaluationDate}
            />
          ) : (
            <p className="text-sm text-corporate-muted italic">
              Niciun ciclu de evaluare tri-lunară finalizat încă.
            </p>
          )}
          {docs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-corporate-muted mb-2">Documente atașate</p>
              <ul className="space-y-2">
                {docs.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-corporate-border px-3 py-2 text-sm"
                  >
                    <span>{doc.nume}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void downloadDocument(doc.id)}>
                      Descarcă
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeFolder === 'istoric_instruire' &&
        (reTraining.length > 0 ? (
          <ul className="space-y-3 mb-4">
            {reTraining.map((s) => {
              const status = normalizeReTrainingStatus(s.status);
              const supervisorName =
                userStore.getUserById(s.supervisorId)?.name ?? s.supervisorId;
              const trainerName = s.trainerId
                ? userStore.getUserById(s.trainerId)?.name ?? s.trainerId
                : undefined;
              return (
                <li key={s.id} className="rounded-lg border border-corporate-border px-3 py-3 text-sm space-y-2">
                  <div className="flex justify-between gap-2">
                    <strong>{s.topicTitle ?? s.titlu}</strong>
                    <Badge variant={status === 'finalizat' ? 'success' : 'warning'}>
                      {RE_TRAINING_STATUS_LABELS[status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-corporate-muted">
                    Supervizor: {supervisorName}
                    {trainerName && <> · Trainer: {trainerName}</>}
                    {' · '}Termen: {s.termenLimita}
                  </p>
                  {s.trainerReport && (
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <p className="font-medium text-corporate-dark">Raport trainer</p>
                      <p className="text-corporate-muted mt-1">{s.trainerReport.text}</p>
                      <p className="text-corporate-muted/80 mt-1">
                        {s.trainerReport.submittedByName} ·{' '}
                        {new Date(s.trainerReport.submittedAt).toLocaleString('ro-RO')}
                      </p>
                    </div>
                  )}
                  {s.supervisorConfirmedAt && (
                    <p className="text-xs text-emerald-700">
                      Confirmat supervizor: {new Date(s.supervisorConfirmedAt).toLocaleString('ro-RO')}
                    </p>
                  )}
                  {s.hrConfirmedAt && (
                    <p className="text-xs text-emerald-700">
                      Validat HR: {new Date(s.hrConfirmedAt).toLocaleString('ro-RO')}
                      {s.hrConfirmedByName ? ` · ${s.hrConfirmedByName}` : ''}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-corporate-muted italic">Nicio sesiune de re-instruire înregistrată.</p>
        ))}

      {docs.length === 0 &&
      activeFolder !== 'documentatie_baza' &&
      activeFolder !== 'istoric_evaluari' &&
      activeFolder !== 'istoric_instruire' ? (
        <p className="text-sm text-corporate-muted italic">Niciun document în acest folder.</p>
      ) : (
        activeFolder !== 'documentatie_baza' &&
        activeFolder !== 'istoric_evaluari' &&
        activeFolder !== 'istoric_instruire' && (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-corporate-border px-3 py-2 text-sm"
              >
                <span>{doc.nume}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => void downloadDocument(doc.id)}>
                  Descarcă
                </Button>
              </li>
            ))}
          </ul>
        )
      )}
    </>
  );

  if (!collapsible) {
    return (
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-corporate-dark">Arhivă angajat</h2>
            <p className="text-sm text-corporate-muted">
              Documentație de bază, evaluări tri-lunale și istoric re-instruire.
            </p>
          </div>
          {showPlanLink && planArchive && (
            <Link to={ingineriPath('/documentatie-baza')}>
              <Button type="button" variant="secondary" size="sm">
                Documentație de bază →
              </Button>
            </Link>
          )}
        </div>
        {body}
      </Card>
    );
  }

  return (
    <ProfessionalPanel
      variant="profile"
      icon="profile"
      eyebrow="Arhivă personală"
      title="Arhivă angajat"
      subtitle="Documentație de bază · evaluări · re-instruire"
      collapsible
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      toggleLabels={{ expanded: 'Restrânge arhiva', collapsed: 'Deschide arhiva angajat' }}
      headerAction={
        expanded && showPlanLink && planArchive ? (
          <Link to={ingineriPath('/documentatie-baza')} onClick={(e) => e.stopPropagation()}>
            <Button type="button" variant="secondary" size="sm">
              Doc. bază →
            </Button>
          </Link>
        ) : undefined
      }
      collapsedPeek={
        <p className="text-sm text-corporate-muted">
          <ArchiveSummary
            planDays={planArchive?.index.length ?? 0}
            evalCount={completedEvaluations.length}
            retrainCount={reTraining.length}
          />
          {' — '}
          apăsați pentru a deschide.
        </p>
      }
    >
      {body}
    </ProfessionalPanel>
  );
}
