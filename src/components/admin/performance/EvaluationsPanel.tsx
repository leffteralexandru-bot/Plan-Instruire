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
import type { EvaluationScores } from '@/types';

const SCORE_FIELDS: { key: keyof EvaluationScores; label: string }[] = [
  { key: 'calitate', label: 'Calitate' },
  { key: 'autonomie', label: 'Autonomie' },
  { key: 'colaborare', label: 'Colaborare' },
  { key: 'respectProceduri', label: 'Respect proceduri' },
];

export function EvaluationsPanel() {
  const { evaluations, documents, updateEvaluation, completeEvaluation, uploadDocument, downloadDocument, refresh } =
    useHrPerformance();
  const { users } = useUsers();
  const { user } = useAuth();
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [concluzii, setConcluzii] = useState('');
  const [planDezvoltare, setPlanDezvoltare] = useState('');
  const [scoruri, setScoruri] = useState<EvaluationScores>({
    calitate: 3,
    autonomie: 3,
    colaborare: 3,
    respectProceduri: 3,
  });
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

  const rows = useMemo(
    () =>
      evaluations
        .filter((e) => e.status !== 'evaluat')
        .map((ev) => {
          const angajat = users.find((u) => u.id === ev.angajatId);
          const evaluator = users.find((u) => u.id === ev.evaluatorId);
          const doc = documents.find((d) => d.evaluationCycleId === ev.id);
          return { ev, angajat, evaluator, doc };
        }),
    [evaluations, users, documents],
  );

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

  const handleComplete = async (evalId: string, angajatId: string, file?: File) => {
    if (!user) return;
    setError('');
    if (concluzii.trim().length < 10) {
      setError('Completați concluziile evaluării (min. 10 caractere).');
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
    completeEvaluation(evalId, { scoruri, concluzii: concluzii.trim(), planDezvoltare, documentId });
    setSelectedId(null);
    setConcluzii('');
    setPlanDezvoltare('');
    setSuccess('Evaluare finalizată. Următorul ciclu de 90 zile a fost creat.');
    refresh();
  };

  return (
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
          Cicluri de evaluare cu termen setat de HR. Încărcați template-ul și arhivați evaluările semnate.
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
                <th className="py-2 pr-3">Evaluator</th>
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
                    <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedId(ev.id)}>
                      Completează
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedId && (
        <Card>
          <h3 className="font-semibold text-corporate-dark mb-3">Finalizare evaluare</h3>
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            {SCORE_FIELDS.map(({ key, label }) => (
              <label key={key} className="block text-sm">
                <span className="text-corporate-muted">{label}</span>
                <select
                  className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                  value={scoruri[key]}
                  onChange={(e) =>
                    setScoruri((s) => ({ ...s, [key]: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 }))
                  }
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ))}
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
        <h3 className="text-sm font-semibold text-corporate-dark mb-2">Ierarhie evaluator — subordonat</h3>
        <ul className="text-sm space-y-1">
          {hrPerformanceStore.getProfiles().map((p) => {
            const mgr = users.find((u) => u.id === p.managerId);
            return (
              <li key={p.userId} className="text-corporate-muted">
                <strong className="text-corporate-dark">
                  {p.prenume} {p.nume}
                </strong>
                {' → '}
                {mgr?.name ?? 'Fără evaluator'}
              </li>
            );
          })}
        </ul>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
  );
}
