import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DesignerCompetencyForm } from '@/components/competency/DesignerCompetencyForm';
import { defaultDesignerCompetencyScores } from '@/data/designerCompetencyMatrix';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import {
  getDefaultEvaluationSettings,
  resetEvaluationSettings,
  saveEvaluationSettings,
  type EvaluationSettings,
} from '@/lib/evaluationSettings';
import { useEvaluationSettings } from '@/hooks/useEvaluationSettings';
import { PLATFORM_SETTINGS_ADMIN_NAME } from '@/lib/platformSettingsAdmin';

export function EmployeeEvaluationSettingsEditor({ embedded }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const { canEditTrainingPlan } = useAccessControl();
  const readOnly = !canEditTrainingPlan;
  const stored = useEvaluationSettings();
  const [draft, setDraft] = useState<EvaluationSettings>(stored);
  const [expandedCriterion, setExpandedCriterion] = useState<number | null>(0);
  const [previewScores, setPreviewScores] = useState(defaultDesignerCompetencyScores());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const flash = (msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(''), 3500);
  };

  const handleSave = useCallback(() => {
    if (!user) return;
    setSaving(true);
    try {
      saveEvaluationSettings(
        {
          cycleDays: draft.cycleDays,
          criteria: draft.criteria,
          selfAssessment: draft.selfAssessment,
        },
        user,
      );
      flash('Setările evaluării au fost salvate. Noile cicluri folosesc aceste valori.');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Nu s-a putut salva.');
    } finally {
      setSaving(false);
    }
  }, [draft, user]);

  const handleReset = () => {
    if (!user) return;
    const ok = window.confirm(
      'Resetați testul de evaluare și ciclul la valorile implicite artGRANIT?',
    );
    if (!ok) return;
    const next = resetEvaluationSettings(user);
    setDraft(next);
    flash('Setări resetate la valorile implicite.');
  };

  const updateCriterion = (
    index: number,
    patch: Partial<EvaluationSettings['criteria'][number]>,
  ) => {
    setDraft((d) => ({
      ...d,
      criteria: d.criteria.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  };

  const updateOptionText = (criterionIndex: number, optionIndex: number, text: string) => {
    setDraft((d) => ({
      ...d,
      criteria: d.criteria.map((c, i) =>
        i !== criterionIndex
          ? c
          : {
              ...c,
              options: c.options.map((o, oi) => (oi === optionIndex ? { ...o, text } : o)),
            },
      ),
    }));
  };

  const updateSelfField = (
    key: keyof EvaluationSettings['selfAssessment'],
    patch: Partial<EvaluationSettings['selfAssessment'][typeof key]>,
  ) => {
    setDraft((d) => ({
      ...d,
      selfAssessment: {
        ...d.selfAssessment,
        [key]: { ...d.selfAssessment[key], ...patch },
      },
    }));
  };

  const shell = embedded ? 'mt-4 space-y-5' : 'space-y-5';

  return (
    <div className={shell}>
      {readOnly && (
        <p className="text-sm text-corporate-muted rounded-lg border border-corporate-border bg-corporate-surface/50 px-3 py-2">
          Mod consultare — puteți deschide criteriile și previzualiza testul. Salvarea se face doar din contul{' '}
          {PLATFORM_SETTINGS_ADMIN_NAME}.
        </p>
      )}
      <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-corporate-dark">Evaluare angajaților</h3>
            <p className="text-sm text-corporate-muted mt-1 max-w-2xl">
              Configurați ciclul tri-lunar și testul pe care îl completează angajații (auto-evaluare +
              matrice competențe). Modificările se aplică la evaluările noi și la formularele deschise
              după salvare.
            </p>
          </div>
          {stored.updatedAt && (
            <p className="text-[10px] text-corporate-muted">
              Ultima salvare: {new Date(stored.updatedAt).toLocaleString('ro-RO')}
              {stored.updatedByName ? ` · ${stored.updatedByName}` : ''}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-end">
          <Input
            label="Ciclu evaluare (zile)"
            type="number"
            min={30}
            max={365}
            readOnly={readOnly}
            value={String(draft.cycleDays)}
            onChange={(e) =>
              setDraft((d) => ({ ...d, cycleDays: Number(e.target.value) || DEFAULT_EVAL_DAYS }))
            }
          />
          <p className="text-xs text-corporate-muted sm:col-span-2 pb-2">
            Implicit <strong>90 zile</strong> (tri-lunar). Se folosește la programarea evaluărilor după
            instruire și la reînnoirea ciclurilor.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-corporate-dark">Întrebări text — auto-evaluare</h4>
        <div className="grid gap-3 lg:grid-cols-3">
          {(
            [
              ['realizari', draft.selfAssessment.realizari],
              ['dificultati', draft.selfAssessment.dificultati],
              ['obiectiveViitoare', draft.selfAssessment.obiectiveViitoare],
            ] as const
          ).map(([key, field]) => (
            <div
              key={key}
              className="rounded-lg border border-corporate-border bg-white p-3 space-y-2"
            >
              <Input
                label="Etichetă câmp"
                value={field.label}
                readOnly={readOnly}
                onChange={(e) => updateSelfField(key, { label: e.target.value })}
              />
              <Textarea
                label="Placeholder"
                value={field.placeholder}
                readOnly={readOnly}
                onChange={(e) => updateSelfField(key, { placeholder: e.target.value })}
                rows={2}
              />
              <Input
                label="Minim caractere"
                type="number"
                min={1}
                max={500}
                readOnly={readOnly}
                value={String(field.minLength)}
                onChange={(e) =>
                  updateSelfField(key, { minLength: Number(e.target.value) || 1 })
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-corporate-dark">
            Matrice competențe — 10 criterii × 4 niveluri
          </h4>
          <Badge variant="default">{draft.criteria.length} criterii</Badge>
        </div>

        <div className="space-y-2">
          {draft.criteria.map((criterion, idx) => {
            const open = expandedCriterion === idx;
            return (
              <div
                key={criterion.id}
                className="rounded-lg border border-corporate-border bg-white overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-corporate-surface/40"
                  onClick={() => setExpandedCriterion(open ? null : idx)}
                >
                  <span className="text-sm font-medium text-corporate-dark">
                    {idx + 1}. {criterion.label}
                  </span>
                  <span className="text-xs text-corporate-muted">{open ? '▲' : '▼'}</span>
                </button>
                {open && (
                  <div className="px-3 pb-3 space-y-3 border-t border-corporate-border/60 pt-3">
                    <Input
                      label="Denumire criteriu"
                      value={criterion.label}
                      readOnly={readOnly}
                      onChange={(e) => updateCriterion(idx, { label: e.target.value })}
                    />
                    <Textarea
                      label="Întrebare auto-evaluare (angajat)"
                      value={criterion.question}
                      readOnly={readOnly}
                      onChange={(e) => updateCriterion(idx, { question: e.target.value })}
                      rows={2}
                    />
                    <Textarea
                      label="Întrebare evaluare supervizor"
                      value={criterion.supervisorQuestion}
                      readOnly={readOnly}
                      onChange={(e) => updateCriterion(idx, { supervisorQuestion: e.target.value })}
                      rows={2}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      {criterion.options.map((opt, oi) => (
                        <Textarea
                          key={opt.level}
                          label={`Nivel ${opt.level}`}
                          value={opt.text}
                          readOnly={readOnly}
                          onChange={(e) => updateOptionText(idx, oi, e.target.value)}
                          rows={2}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-corporate-border bg-corporate-surface/30 p-4 space-y-2">
        <h4 className="text-sm font-semibold text-corporate-dark">Previzualizare test angajat</h4>
        <p className="text-xs text-corporate-muted">
          Așa vede angajatul matricea după salvare (doar previzualizare, fără trimitere).
        </p>
        <DesignerCompetencyForm
          scores={previewScores}
          onChange={setPreviewScores}
          compact
          perspective="employee"
        />
      </section>

      {!readOnly && (
      <div className="flex flex-wrap gap-2 pt-2 border-t border-corporate-border">
        <Button type="button" variant="primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Se salvează…' : 'Salvează evaluarea angajaților'}
        </Button>
        <Button type="button" variant="secondary" onClick={handleReset}>
          Resetează la implicit
        </Button>
      </div>
      )}

      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </div>
  );
}

const DEFAULT_EVAL_DAYS = getDefaultEvaluationSettings().cycleDays;
