import { useState, useMemo, useEffect } from 'react';
import type { EmployeeSelfAssessment, EvaluationCycle } from '@/types';
import { defaultDesignerCompetencyScores } from '@/data/designerCompetencyMatrix';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { EvaluationDualReviewPanel } from '@/components/evaluation/EvaluationDualReviewPanel';
import {
  EVALUATION_STAGE_STATUS_LABELS,
  canEmployeeSubmitSelfAssessment,
  canHrFinalizeEvaluation,
  getActiveStage,
  getVisibleEvaluationStages,
  isEmployeeSelfAssessmentStageDone,
  isSupervisorEvaluationStageDone,
  needsEvaluationWorkflowStart,
  validateSelfAssessmentSubmission,
  validateSupervisorAssessmentSubmission,
} from '@/lib/evaluationStages';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { canViewSalaryCoefficient } from '@/lib/roles';
import { useAuth } from '@/hooks/useAuth';
import { useEvaluationSettings } from '@/hooks/useEvaluationSettings';
import { computeCompetencyOutcome, isCompetencyScoresComplete } from '@/lib/competencyScoring';
import { DesignerCompetencyForm } from '@/components/competency/DesignerCompetencyForm';
import { DesignerCompetencySummary } from '@/components/competency/DesignerCompetencySummary';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveStatusText } from '@/components/shared/AutoSaveIndicator';

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
  onDownloadDocument: _onDownloadDocument,
  onUpdated,
}: EvaluationStagesFlowProps) {
  const { user } = useAuth();
  const { selfAssessment: selfFields } = useEvaluationSettings();
  const showSalary = canViewSalaryCoefficient(user);
  const active = getActiveStage(cycle);
  const visibleStages = getVisibleEvaluationStages(cycle);
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

  useEffect(() => {
    setForm(assessment);
    setSupervisorForm(supervisorDefaults);
    setSelfCompetency(cycle.competencySelfScores ?? defaultDesignerCompetencyScores());
    setSupervisorCompetency(
      cycle.competencySupervisorScores ??
        cycle.competencySelfScores ??
        defaultDesignerCompetencyScores(),
    );
  }, [cycle.id, cycle.updatedAt, assessment, supervisorDefaults, cycle.competencySelfScores, cycle.competencySupervisorScores]);

  const employeeStepDone = mode === 'employee' && isEmployeeSelfAssessmentStageDone(cycle);

  const selfDraft = useMemo(() => ({ form, selfCompetency }), [form, selfCompetency]);
  const selfBaseline = useMemo(
    () => ({
      form: assessment,
      selfCompetency: cycle.competencySelfScores ?? defaultDesignerCompetencyScores(),
    }),
    [assessment, cycle.competencySelfScores],
  );

  const supervisorDraft = useMemo(
    () => ({ supervisorForm, supervisorCompetency }),
    [supervisorForm, supervisorCompetency],
  );
  const supervisorBaseline = useMemo(
    () => ({
      supervisorForm: supervisorDefaults,
      supervisorCompetency:
        cycle.competencySupervisorScores ??
        cycle.competencySelfScores ??
        defaultDesignerCompetencyScores(),
    }),
    [supervisorDefaults, cycle.competencySupervisorScores, cycle.competencySelfScores],
  );

  const canEditSelf =
    (mode === 'employee' || mode === 'hr') &&
    active?.id === 'auto_evaluare' &&
    active.status === 'in_curs' &&
    !employeeStepDone;
  const canEditSupervisor =
    mode === 'evaluator' && active?.id === 'evaluare_mentor' && active.status === 'in_curs';

  useAutoSave({
    draft: selfDraft,
    baseline: selfBaseline,
    enabled: canEditSelf,
    save: (d) => {
      hrPerformanceStore.saveEmployeeSelfAssessment(
        cycle.id,
        d.form,
        { id: actorId, name: actorName },
        d.selfCompetency,
      );
      onUpdated?.();
    },
  });

  useAutoSave({
    draft: supervisorDraft,
    baseline: supervisorBaseline,
    enabled: canEditSupervisor,
    save: (d) => {
      hrPerformanceStore.saveSupervisorAssessmentDraft(cycle.id, {
        supervisorAssessment: d.supervisorForm,
        competencySupervisorScores: d.supervisorCompetency,
      });
      onUpdated?.();
    },
  });

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
      <div className="mb-2 hidden @md:flex justify-end">
        <AutoSaveStatusText />
      </div>
      <ol className="space-y-2">
        {visibleStages.map((stage, idx) => (
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

      {mode === 'hr' && !needsEvaluationWorkflowStart(cycle) && active?.id === 'evaluare_mentor' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <p className="text-sm text-amber-900">
            Așteptați supervizorul să completeze evaluarea oficială. HR vede răspunsurile (doar citire) —
            nu le poate modifica. După supervizor, folosiți <strong>Finalizează</strong> în tabel.
          </p>
        </div>
      )}

      {mode === 'hr' && canHrFinalizeEvaluation(cycle) && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
          <p className="text-sm text-emerald-900">
            Evaluarea supervizorului este înregistrată. Comparați cu auto-evaluarea și folosiți butonul{' '}
            <strong>Finalizează</strong> din tabel pentru concluzii și confirmare oficială.
          </p>
        </div>
      )}

      {mode === 'hr' && needsEvaluationWorkflowStart(cycle) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <p className="text-sm text-amber-900">
            Evaluarea nu este pornită. Apăsați <strong>Pornește</strong> în tabelul de evaluări.
          </p>
        </div>
      )}

      {mode === 'hr' && !needsEvaluationWorkflowStart(cycle) && active?.id === 'auto_evaluare' && active.status === 'in_curs' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
          <p className="text-sm font-semibold text-emerald-900">Evaluare pornită — așteptați angajatul</p>
          <p className="text-sm text-emerald-800">
            Angajatul completează auto-evaluarea în Panou Angajat sau pagina Evaluări. HR nu completează
            această etapă — doar urmăriți progresul mai jos.
          </p>
          <ul className="text-xs text-emerald-900/90 list-disc pl-4 space-y-0.5">
            <li>Realizări, dificultăți și obiective (minim caractere cerute)</li>
            <li>Matrice competențe — 10 criterii notate 1–4</li>
          </ul>
          {cycle.employeeSelfAssessment && (
            <div className="mt-2 pt-2 border-t border-emerald-200/80 text-xs text-emerald-800">
              <p className="font-medium">Progres parțial salvat de angajat</p>
              {cycle.employeeSelfAssessment.realizari.trim() && (
                <p className="mt-1 truncate">Realizări: {cycle.employeeSelfAssessment.realizari}</p>
              )}
              {cycle.competencySelfScores && (
                <p className="mt-0.5">
                  Matrice: {isCompetencyScoresComplete(cycle.competencySelfScores) ? 'completă' : 'în lucru'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'hr' && isEmployeeSelfAssessmentStageDone(cycle) && !isSupervisorEvaluationStageDone(cycle) && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <p className="text-sm font-semibold text-corporate-dark">Auto-evaluare angajat — finalizată (doar citire)</p>
          {cycle.employeeSelfAssessment && (
            <div className="text-sm space-y-1 text-corporate-muted">
              <p><strong className="text-corporate-stone">Realizări:</strong> {cycle.employeeSelfAssessment.realizari}</p>
              <p><strong className="text-corporate-stone">Dificultăți:</strong> {cycle.employeeSelfAssessment.dificultati}</p>
              <p><strong className="text-corporate-stone">Obiective:</strong> {cycle.employeeSelfAssessment.obiectiveViitoare}</p>
            </div>
          )}
          {cycle.competencySelfScores && (
            <DesignerCompetencySummary scores={cycle.competencySelfScores} hideCriteriaTable />
          )}
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

      {mode === 'employee' &&
        !employeeStepDone &&
        canEmployeeSubmitSelfAssessment(cycle) &&
        active?.id === 'auto_evaluare' && (
          <section className="space-y-3 border-t border-corporate-border pt-4">
            <h4 className="text-sm font-semibold text-corporate-dark">
              Auto-evaluare — completează și trimite
            </h4>
            <p className="text-xs text-corporate-muted">
              Toate câmpurile sunt obligatorii. După trimitere, etapa ta se închide automat.
            </p>
            <label className="block text-sm">
              <span className="text-corporate-muted">{selfFields.realizari.label} *</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[72px]"
                value={form.realizari}
                onChange={(e) => setForm((f) => ({ ...f, realizari: e.target.value }))}
                placeholder={selfFields.realizari.placeholder}
              />
            </label>
            <label className="block text-sm">
              <span className="text-corporate-muted">{selfFields.dificultati.label} *</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[60px]"
                value={form.dificultati}
                onChange={(e) => setForm((f) => ({ ...f, dificultati: e.target.value }))}
                placeholder={selfFields.dificultati.placeholder}
              />
            </label>
            <label className="block text-sm">
              <span className="text-corporate-muted">{selfFields.obiectiveViitoare.label} *</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[60px]"
                value={form.obiectiveViitoare}
                onChange={(e) => setForm((f) => ({ ...f, obiectiveViitoare: e.target.value }))}
                placeholder={selfFields.obiectiveViitoare.placeholder}
              />
            </label>
            <div>
              <h5 className="text-sm font-medium text-corporate-dark mb-2">
                Chestionar competențe — inginer proiectant
              </h5>
              <DesignerCompetencyForm scores={selfCompetency} onChange={setSelfCompetency} compact />
            </div>
            <Button type="button" variant="primary" size="sm" onClick={handleSaveSelfAssessment}>
              Trimite auto-evaluarea
            </Button>
          </section>
        )}

      {mode === 'evaluator' && active?.id === 'evaluare_mentor' && (
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

      {mode === 'hr' && canHrFinalizeEvaluation(cycle) && (
        <section className="border-t border-corporate-border pt-4 space-y-3">
          <h4 className="text-sm font-semibold text-corporate-dark">Validare HR</h4>
          <EvaluationDualReviewPanel cycle={cycle} showSalaryCoefficient={showSalary} />
          <p className="text-xs text-corporate-muted">
            Deschideți <strong>Finalizează</strong> în tabelul HR pentru concluzii și confirmarea oficială.
          </p>
        </section>
      )}

      {(mode === 'view' || cycle.status === 'evaluat' || (mode === 'hr' && isSupervisorEvaluationStageDone(cycle))) &&
        previewOutcome && (
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
