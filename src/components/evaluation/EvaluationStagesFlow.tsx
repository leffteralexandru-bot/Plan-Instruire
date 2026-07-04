import { useState } from 'react';
import type { EmployeeSelfAssessment, EvaluationCycle } from '@/types';
import { defaultDesignerCompetencyScores } from '@/data/designerCompetencyMatrix';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import {
  EVALUATION_STAGE_STATUS_LABELS,
  canEmployeeSubmitSelfAssessment,
  getActiveStage,
  isEmployeeSelfAssessmentStageDone,
  needsEvaluationWorkflowStart,
  validateSelfAssessmentSubmission,
  validateSupervisorAssessmentSubmission,
} from '@/lib/evaluationStages';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { canViewSalaryCoefficient } from '@/lib/roles';
import { useAuth } from '@/hooks/useAuth';
import { computeCompetencyOutcome, isCompetencyScoresComplete } from '@/lib/competencyScoring';
import { DesignerCompetencyForm } from '@/components/competency/DesignerCompetencyForm';
import { DesignerCompetencySummary } from '@/components/competency/DesignerCompetencySummary';

interface EvaluationStagesFlowProps {
  cycle: EvaluationCycle;
  mode: 'hr' | 'employee' | 'evaluator' | 'view';
  actorId: string;
  actorName: string;
  onDownloadDocument?: (id: string) => void;
  onUpdated?: () => void;
}

export function EvaluationStagesFlow({
  cycle,
  mode,
  actorId,
  actorName,
  onDownloadDocument,
  onUpdated,
}: EvaluationStagesFlowProps) {
  const { user } = useAuth();
  const showSalary = canViewSalaryCoefficient(user);
  const active = getActiveStage(cycle);
  const assessment = cycle.employeeSelfAssessment ?? {
    realizari: '',
    dificultati: '',
    obiectiveViitoare: '',
  };
  const [form, setForm] = useState<EmployeeSelfAssessment>(assessment);
  const supervisorDefaults = cycle.supervisorAssessment ?? {
    realizari: '',
    dificultati: '',
    obiectiveViitoare: '',
  };
  const [supervisorForm, setSupervisorForm] = useState<EmployeeSelfAssessment>(supervisorDefaults);
  const [selfCompetency, setSelfCompetency] = useState(
    cycle.competencySelfScores ?? defaultDesignerCompetencyScores(),
  );
  const [supervisorCompetency, setSupervisorCompetency] = useState(
    cycle.competencySupervisorScores ??
      cycle.competencySelfScores ??
      defaultDesignerCompetencyScores(),
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const electronicDoc = cycle.electronicDocumentId
    ? hrPerformanceStore.getDocuments().find((d) => d.id === cycle.electronicDocumentId)
    : undefined;

  const handleStart = () => {
    hrPerformanceStore.startEvaluationWorkflow(cycle.id, { id: actorId, name: actorName });
    setSuccess('Fluxul de evaluare a fost pornit. Angajatul poate completa auto-evaluarea.');
    onUpdated?.();
  };

  const handleSaveSelfAssessment = () => {
    setError('');
    setSuccess('');
    const validationError = validateSelfAssessmentSubmission(
      form,
      isCompetencyScoresComplete(selfCompetency),
    );
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const updated = hrPerformanceStore.saveEmployeeSelfAssessment(
        cycle.id,
        form,
        { id: actorId, name: actorName },
        selfCompetency,
      );
      if (isEmployeeSelfAssessmentStageDone(updated)) {
        setSuccess(
          mode === 'employee'
            ? 'Auto-evaluarea ta a fost trimisă. Urmează evaluarea supervizorului — te vom anunța când e gata.'
            : 'Auto-evaluare finalizată. Etapa supervizorului este acum activă.',
        );
      } else {
        setSuccess('Date salvate parțial.');
      }
      onUpdated?.();
    } catch {
      setError('Nu s-a putut salva auto-evaluarea.');
    }
  };

  const employeeStepDone = mode === 'employee' && isEmployeeSelfAssessmentStageDone(cycle);
  const waitingForSupervisor =
    employeeStepDone && getActiveStage(cycle)?.id === 'evaluare_mentor';

  const handleSaveMentor = () => {
    setError('');
    const validationError = validateSupervisorAssessmentSubmission(
      supervisorForm,
      isCompetencyScoresComplete(supervisorCompetency),
    );
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      hrPerformanceStore.saveMentorEvaluationStage(
        cycle.id,
        {
          supervisorAssessment: supervisorForm,
          competencySupervisorScores: supervisorCompetency,
        },
        { id: actorId, name: actorName },
      );
      setSuccess('Evaluarea supervizorului a fost înregistrată. HR poate finaliza validarea.');
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nu s-a putut salva evaluarea.');
    }
  };

  const previewOutcome =
    cycle.competencyResult ??
    (isCompetencyScoresComplete(cycle.competencySupervisorScores)
      ? computeCompetencyOutcome(cycle.competencySupervisorScores)
      : isCompetencyScoresComplete(cycle.competencySelfScores)
        ? computeCompetencyOutcome(cycle.competencySelfScores)
        : undefined);

  return (
    <ProfessionalPanel
      variant="evaluation"
      icon="evaluation"
      eyebrow="Performanță HR · tri-lunar"
      title="Parcurgere evaluare — etape"
      subtitle="Auto-evaluare angajat → Evaluare supervizor → Validare HR · Matrice inginer proiectant"
      compact
    >
      {electronicDoc && onDownloadDocument && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-corporate-surface text-sm">
          <span className="text-corporate-muted">Fișier evaluare:</span>
          <Button type="button" variant="secondary" size="sm" onClick={() => onDownloadDocument(electronicDoc.id)}>
            {electronicDoc.nume}
          </Button>
        </div>
      )}

      <ol className="space-y-2">
        {(cycle.stages ?? []).map((stage, idx) => (
          <li
            key={stage.id}
            className={[
              'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm',
              stage.status === 'in_curs'
                ? 'border-corporate-gold bg-corporate-gold-light/30'
                : stage.status === 'completat'
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-corporate-border',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                stage.status === 'completat'
                  ? 'bg-emerald-600 text-white'
                  : stage.status === 'in_curs'
                    ? 'bg-corporate-gold text-corporate-black'
                    : 'bg-slate-200 text-slate-600',
              ].join(' ')}
            >
              {stage.status === 'completat' ? '✓' : idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-corporate-dark">{stage.label}</p>
              <Badge variant={stage.status === 'completat' ? 'success' : stage.status === 'in_curs' ? 'warning' : 'default'}>
                {EVALUATION_STAGE_STATUS_LABELS[stage.status]}
              </Badge>
              {stage.completedByName && (
                <p className="text-xs text-corporate-muted mt-1">
                  {stage.completedByName}
                  {stage.completedAt && ` · ${new Date(stage.completedAt).toLocaleDateString('ro-RO')}`}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {mode === 'hr' && needsEvaluationWorkflowStart(cycle) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2">
          <p className="text-sm text-amber-900">
            Evaluarea este planificată dar nu a fost pornită. Apasă butonul pentru a deschide
            auto-evaluarea angajatului.
          </p>
          <Button type="button" variant="primary" size="sm" onClick={handleStart}>
            Pornește evaluarea pentru angajat
          </Button>
        </div>
      )}

      {waitingForSupervisor && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 space-y-1">
          <p className="text-sm font-semibold text-emerald-900">Auto-evaluare finalizată</p>
          <p className="text-sm text-emerald-800">
            Etapa ta este completă. Supervizorul va valida matricea de competențe, apoi HR finalizează
            evaluarea.
          </p>
        </div>
      )}

      {(mode === 'employee' || mode === 'hr') &&
        !employeeStepDone &&
        (canEmployeeSubmitSelfAssessment(cycle) || mode === 'hr') &&
        active?.id === 'auto_evaluare' && (
          <section className="space-y-3 border-t border-corporate-border pt-4">
            <h4 className="text-sm font-semibold text-corporate-dark">
              {mode === 'hr' ? 'Editare auto-evaluare angajat' : 'Auto-evaluare — completează și trimite'}
            </h4>
            <p className="text-xs text-corporate-muted">
              Toate câmpurile sunt obligatorii. După trimitere, etapa ta se închide automat.
            </p>
            <label className="block text-sm">
              <span className="text-corporate-muted">Realizări în perioada evaluată *</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[72px]"
                value={form.realizari}
                onChange={(e) => setForm((f) => ({ ...f, realizari: e.target.value }))}
                placeholder="Min. 20 caractere — proiecte, competențe dobândite…"
              />
            </label>
            <label className="block text-sm">
              <span className="text-corporate-muted">Dificultăți întâmpinate *</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[60px]"
                value={form.dificultati}
                onChange={(e) => setForm((f) => ({ ...f, dificultati: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-corporate-muted">Obiective viitoare *</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[60px]"
                value={form.obiectiveViitoare}
                onChange={(e) => setForm((f) => ({ ...f, obiectiveViitoare: e.target.value }))}
              />
            </label>
            <div>
              <h5 className="text-sm font-medium text-corporate-dark mb-2">
                Chestionar competențe — inginer proiectant
              </h5>
              <DesignerCompetencyForm scores={selfCompetency} onChange={setSelfCompetency} compact />
            </div>
            <Button type="button" variant="primary" size="sm" onClick={handleSaveSelfAssessment}>
              {mode === 'employee' ? 'Trimite auto-evaluarea' : 'Salvează auto-evaluarea'}
            </Button>
          </section>
        )}

      {(mode === 'evaluator' || mode === 'hr') && active?.id === 'evaluare_mentor' && (
        <section className="space-y-3 border-t border-corporate-border pt-4">
          <h4 className="text-sm font-semibold text-corporate-dark">Evaluare supervizor</h4>
          <p className="text-xs text-corporate-muted">
            Aceleași întrebări ca la auto-evaluare — completați din perspectiva supervizorului asupra angajatului.
          </p>
          {cycle.employeeSelfAssessment?.completedAt && (
            <details className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs text-corporate-muted">
              <summary className="cursor-pointer font-medium text-corporate-dark">
                Răspunsuri auto-evaluare angajat
              </summary>
              <div className="space-y-1 mt-2">
                <p><strong>Realizări:</strong> {cycle.employeeSelfAssessment.realizari}</p>
                <p><strong>Dificultăți:</strong> {cycle.employeeSelfAssessment.dificultati}</p>
                <p><strong>Obiective:</strong> {cycle.employeeSelfAssessment.obiectiveViitoare}</p>
              </div>
            </details>
          )}
          {cycle.competencySelfScores && (
            <div>
              <p className="text-xs font-medium text-corporate-muted mb-2">Auto-evaluare competențe (angajat)</p>
              <DesignerCompetencySummary scores={cycle.competencySelfScores} />
            </div>
          )}
          <label className="block text-sm">
            <span className="text-corporate-muted">Realizări observate la angajat în perioada evaluată *</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[72px]"
              value={supervisorForm.realizari}
              onChange={(e) => setSupervisorForm((f) => ({ ...f, realizari: e.target.value }))}
              placeholder="Min. 20 caractere — proiecte, progres, competențe observate…"
            />
          </label>
          <label className="block text-sm">
            <span className="text-corporate-muted">Dificultăți observate *</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[60px]"
              value={supervisorForm.dificultati}
              onChange={(e) => setSupervisorForm((f) => ({ ...f, dificultati: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-corporate-muted">Obiective recomandate pentru următoarea perioadă *</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[60px]"
              value={supervisorForm.obiectiveViitoare}
              onChange={(e) => setSupervisorForm((f) => ({ ...f, obiectiveViitoare: e.target.value }))}
            />
          </label>
          <div>
            <h5 className="text-sm font-medium text-corporate-dark mb-2">
              Matrice competențe — evaluare supervizor
            </h5>
            <DesignerCompetencyForm
              scores={supervisorCompetency}
              onChange={setSupervisorCompetency}
              perspective="supervisor"
              compact
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleSaveMentor}>
            Salvează evaluarea supervizorului
          </Button>
        </section>
      )}

      {cycle.supervisorAssessment?.completedAt && (mode === 'view' || mode === 'hr' || cycle.status === 'evaluat') && (
        <section className="text-sm space-y-2 border-t border-corporate-border pt-4">
          <p className="font-medium text-corporate-dark">Evaluare supervizor înregistrată</p>
          <p className="text-corporate-muted"><strong>Realizări:</strong> {cycle.supervisorAssessment.realizari}</p>
          <p className="text-corporate-muted"><strong>Dificultăți:</strong> {cycle.supervisorAssessment.dificultati}</p>
          <p className="text-corporate-muted"><strong>Obiective:</strong> {cycle.supervisorAssessment.obiectiveViitoare}</p>
        </section>
      )}

      {(mode === 'view' || mode === 'hr' || cycle.status === 'evaluat') && previewOutcome && (
        <section className="border-t border-corporate-border pt-4">
          <h4 className="text-sm font-semibold text-corporate-dark mb-3">Rezultat matrice competențe</h4>
          <DesignerCompetencySummary
            scores={previewOutcome.scores}
            outcome={previewOutcome}
            showSalaryCoefficient={showSalary && mode === 'hr'}
          />
        </section>
      )}

      {mode === 'view' && cycle.employeeSelfAssessment && !previewOutcome && (
        <div className="text-sm space-y-2 border-t border-corporate-border pt-4">
          <p className="font-medium text-corporate-dark">Auto-evaluare înregistrată</p>
          <p className="text-corporate-muted">{cycle.employeeSelfAssessment.realizari}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </ProfessionalPanel>
  );
}
