import { useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { useAuth } from '@/hooks/useAuth';
import {
  EVALUATION_STATUS_LABELS,
  hrPerformanceStore,
} from '@/lib/hrPerformanceStore';
import { EvaluationStagesFlow } from '@/components/evaluation/EvaluationStagesFlow';
import { DesignerCompetencyForm } from '@/components/competency/DesignerCompetencyForm';
import { DesignerCompetencySummary } from '@/components/competency/DesignerCompetencySummary';
import { defaultDesignerCompetencyScores } from '@/data/designerCompetencyMatrix';
import { computeCompetencyOutcome, isCompetencyScoresComplete } from '@/lib/competencyScoring';
import { canViewSalaryCoefficient } from '@/lib/roles';
import { needsEvaluationWorkflowStart } from '@/lib/evaluationStages';
import { TestingHighlightZone } from '@/components/shared/TestingHighlightZone';
import type { DesignerCompetencyScores } from '@/types';

export function EvaluationsPanel() {
  const { evaluations, documents, updateEvaluation, completeEvaluation, uploadDocument, downloadDocument, refresh } =
    useHrPerformance();
  const { users } = useUsers();
  const { user } = useAuth();
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewStagesId, setViewStagesId] = useState<string | null>(null);
  const [concluzii, setConcluzii] = useState('');
  const [planDezvoltare, setPlanDezvoltare] = useState('');
  const [competencyScores, setCompetencyScores] = useState<DesignerCompetencyScores>(
    defaultDesignerCompetencyScores(),
  );
  const showSalary = canViewSalaryCoefficient(user);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const template = documents.find((d) => d.tip === 'template_evaluare' && !d.angajatId);

  const stats = useMemo(() => {
    const active = evaluations.filter((e) => e.status !== 'evaluat');
    return {
      total: active.length,
      intarziate: active.filter((e) => e.status === 'intarziat').length,
      finalizate: evaluations.filter((e) => e.status === 'evaluat').length,
    };
  }, [evaluations]);

  const knownUserIds = useMemo(() => new Set(users.map((u) => u.id)), [users]);

  const rows = useMemo(
    () =>
      evaluations
        .filter((e) => e.status !== 'evaluat' && knownUserIds.has(e.angajatId))
        .map((ev) => {
          const angajat = users.find((u) => u.id === ev.angajatId);
          const evaluator = users.find((u) => u.id === ev.evaluatorId);
          const doc = documents.find((d) => d.evaluationCycleId === ev.id);
          return { ev, angajat, evaluator, doc };
        }),
    [evaluations, users, documents, knownUserIds],
  );

  const handleStartEvaluation = (evalId: string) => {
    if (!user) return;
    hrPerformanceStore.startEvaluationWorkflow(evalId, { id: user.id, name: user.name });
    setViewStagesId(evalId);
    refresh();
    setSuccess('Evaluarea a fost pornită. Angajatul poate completa auto-evaluarea.');
  };

  const handleTemplateUpload = async (file: File) => {
    if (!user) return;
    await uploadDocument({
      file,
      tip: 'template_evaluare',
      uploadedBy: user.id,
      uploadedByNume: user.name,
    });
    setSuccess('Template evaluare încărcat.');
  };

  const handleElectronicUpload = async (evalId: string, angajatId: string, file: File) => {
    if (!user) return;
    const doc = await uploadDocument({
      file,
      tip: 'evaluare_electronica',
      angajatId,
      uploadedBy: user.id,
      uploadedByNume: user.name,
      evaluationCycleId: evalId,
      folder: 'istoric_evaluari',
    });
    hrPerformanceStore.updateEvaluation(evalId, { electronicDocumentId: doc.id });
    refresh();
    setSuccess('Fișier evaluare electronică atașat ciclului.');
  };

  const handleComplete = async (evalId: string, angajatId: string, file?: File) => {
    if (!user) return;
    setError('');
    if (concluzii.trim().length < 10) {
      setError('Completați concluziile evaluării (min. 10 caractere).');
      return;
    }
    if (!isCompetencyScoresComplete(competencyScores)) {
      setError('Completați matricea de competențe (10 criterii) înainte de finalizare.');
      return;
    }
    let documentId: string | undefined;
    if (file) {
      const doc = await uploadDocument({
        file,
        tip: 'evaluare_semnata',
        angajatId,
        uploadedBy: user.id,
        uploadedByNume: user.name,
        evaluationCycleId: evalId,
        folder: 'istoric_evaluari',
      });
      documentId = doc.id;
    }
    completeEvaluation(evalId, {
      competencySupervisorScores: competencyScores,
      concluzii: concluzii.trim(),
      planDezvoltare,
      documentId,
    });
    setSelectedId(null);
    setConcluzii('');
    setPlanDezvoltare('');
    setSuccess('Evaluare finalizată. Următorul ciclu de 90 zile a fost creat.');
    refresh();
  };

  return (
    <TestingHighlightZone zoneId="zone-hr-evaluari">
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-xs text-corporate-muted uppercase">Active</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-corporate-muted uppercase">Întârziate</p>
          <p className="text-2xl font-bold text-amber-600">{stats.intarziate}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-corporate-muted uppercase">Finalizate</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.finalizate}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Evaluări tri-lunale (90 zile)</h2>
        <p className="text-sm text-corporate-muted mb-4">
          Cicluri de evaluare cu termen setat de HR. Încărcați template-ul, atașați fișierul de evaluare per angajat
          și urmăriți parcurgerea etapelor: auto-evaluare → supervizor → validare HR.
        </p>

        <div className="flex flex-wrap gap-2 mb-6 p-3 rounded-xl bg-corporate-surface">
          <input
            ref={templateInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleTemplateUpload(f);
              e.target.value = '';
            }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => templateInputRef.current?.click()}>
            {template ? 'Înlocuiește template' : 'Încarcă template evaluare'}
          </Button>
          {template && (
            <Button type="button" variant="ghost" size="sm" onClick={() => void downloadDocument(template.id)}>
              Descarcă: {template.nume}
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-corporate-border text-left text-corporate-muted">
                <th className="py-2 pr-3">Angajat</th>
                <th className="py-2 pr-3">Supervizor</th>
                <th className="py-2 pr-3">Perioadă</th>
                <th className="py-2 pr-3">Termen</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ ev, angajat, evaluator }) => (
                <tr key={ev.id} className="border-b border-corporate-border/60 align-top">
                  <td className="py-2 pr-3 font-medium">{angajat?.name ?? ev.angajatId}</td>
                  <td className="py-2 pr-3 text-corporate-muted">{evaluator?.name ?? '—'}</td>
                  <td className="py-2 pr-3 text-corporate-muted text-xs">
                    {ev.perioadaStart} → {ev.perioadaEnd}
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="date"
                      value={ev.termenReevaluare}
                      onChange={(e) => updateEvaluation(ev.id, { termenReevaluare: e.target.value })}
                      className="text-xs"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant={ev.status === 'intarziat' ? 'warning' : 'default'}>
                      {EVALUATION_STATUS_LABELS[ev.status]}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {needsEvaluationWorkflowStart(ev) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          onClick={() => handleStartEvaluation(ev.id)}
                        >
                          Pornește
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="ghost" onClick={() => setViewStagesId(ev.id)}>
                        Etape
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedId(ev.id);
                          setCompetencyScores(
                            ev.competencySupervisorScores ??
                              ev.competencySelfScores ??
                              defaultDesignerCompetencyScores(),
                          );
                          setConcluzii(ev.concluzii ?? '');
                          setPlanDezvoltare(ev.planDezvoltare ?? '');
                        }}
                      >
                        Finalizează
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {viewStagesId && user && (
        <div className="space-y-3">
          {(() => {
            const ev = evaluations.find((e) => e.id === viewStagesId);
            if (!ev) return null;
            const electronicDoc = documents.find((d) => d.id === ev.electronicDocumentId);
            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-corporate-dark">
                    Flux evaluare — {users.find((u) => u.id === ev.angajatId)?.name}
                  </h3>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setViewStagesId(null)}>
                    Închide
                  </Button>
                </div>
                <Card padding="sm" className="flex flex-wrap gap-2 items-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="text-sm"
                    id={`electronic-${ev.id}`}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleElectronicUpload(ev.id, ev.angajatId, f);
                      e.target.value = '';
                    }}
                  />
                  {electronicDoc && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => void downloadDocument(electronicDoc.id)}>
                      {electronicDoc.nume}
                    </Button>
                  )}
                  <span className="text-xs text-corporate-muted">
                    Încărcați / înlocuiți fișierul de evaluare pentru acest angajat
                  </span>
                </Card>
                <EvaluationStagesFlow
                  cycle={ev}
                  mode="hr"
                  actorId={user.id}
                  actorName={user.name}
                  onDownloadDocument={(id) => void downloadDocument(id)}
                  onUpdated={refresh}
                />
              </>
            );
          })()}
        </div>
      )}

      {selectedId && (
        <Card>
          <h3 className="font-semibold text-corporate-dark mb-3">Finalizare evaluare — validare HR</h3>
          {isCompetencyScoresComplete(competencyScores) && (
            <div className="mb-4">
              <DesignerCompetencySummary
                scores={competencyScores}
                outcome={computeCompetencyOutcome(competencyScores)}
                showSalaryCoefficient={showSalary}
              />
            </div>
          )}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-corporate-dark mb-2">
              Matrice competențe — inginer proiectant
            </h4>
            <DesignerCompetencyForm scores={competencyScores} onChange={setCompetencyScores} compact />
          </div>
          <div className="space-y-3 mb-4">
            <label className="block text-sm">
              <span className="text-corporate-muted">Concluzii *</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[80px]"
                value={concluzii}
                onChange={(e) => setConcluzii(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-corporate-muted">Plan de dezvoltare</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[60px]"
                value={planDezvoltare}
                onChange={(e) => setPlanDezvoltare(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-corporate-muted">Evaluare semnată (PDF/scan)</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="mt-1 block text-sm"
                id="eval-doc-upload"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                const ev = evaluations.find((e) => e.id === selectedId);
                if (!ev) return;
                const file = (document.getElementById('eval-doc-upload') as HTMLInputElement)?.files?.[0];
                void handleComplete(ev.id, ev.angajatId, file);
              }}
            >
              Salvează evaluarea
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSelectedId(null)}>
              Anulează
            </Button>
          </div>
        </Card>
      )}

      <Card padding="sm">
        <h3 className="text-sm font-semibold text-corporate-dark mb-2">Ierarhie supervizor — angajat</h3>
        <ul className="text-sm space-y-1">
          {hrPerformanceStore
            .getProfiles()
            .filter((p) => knownUserIds.has(p.userId) && (p.supervisorId || p.managerId))
            .map((p) => {
            const sup = users.find((u) => u.id === (p.supervisorId ?? p.managerId));
            return (
              <li key={p.userId} className="text-corporate-muted">
                <strong className="text-corporate-dark">
                  {p.prenume} {p.nume}
                </strong>
                {' → '}
                {sup?.name ?? 'Fără supervizor'}
              </li>
            );
          })}
        </ul>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
    </TestingHighlightZone>
  );
}
