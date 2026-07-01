import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { useAuth } from '@/hooks/useAuth';
import { ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';
import type { ErrorMotiv } from '@/types';

function KpiTrendChart({ snapshots }: { snapshots: { luna: string; eroriLuna: number }[] }) {
  const max = Math.max(...snapshots.map((s) => s.eroriLuna), 1);
  return (
    <div className="flex items-end gap-3 h-32 pt-4">
      {snapshots.map((s) => (
        <div key={s.luna} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-corporate-dark">{s.eroriLuna}</span>
          <div
            className="w-full max-w-[3rem] rounded-t bg-corporate-gold/80 transition-all"
            style={{ height: `${Math.max(8, (s.eroriLuna / max) * 100)}%` }}
          />
          <span className="text-[10px] text-corporate-muted">{s.luna.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export function ErrorsKpiPanel() {
  const { errorCases, kpiSnapshots, addErrorCase, updateErrorCase, uploadDocument, profiles } =
    useHrPerformance();
  const { users, mentors } = useUsers();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [angajatId, setAngajatId] = useState('');
  const [motiv, setMotiv] = useState<ErrorMotiv>('neatentie');
  const [descriere, setDescriere] = useState('');
  const [proiectNume, setProiectNume] = useState('');
  const [pasi, setPasi] = useState('');
  const [termenLimita, setTermenLimita] = useState('');
  const [responsabilId, setResponsabilId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const luna = new Date().toISOString().slice(0, 7);
  const eroriLuna = errorCases.filter((e) => e.data.startsWith(luna)).length;
  const planuriDeschise = errorCases.filter((e) => e.planActiune.status !== 'inchis').length;

  const trend = useMemo(
    () => kpiSnapshots.slice(-6).map((s) => ({ luna: s.luna, eroriLuna: s.eroriLuna })),
    [kpiSnapshots],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !angajatId) return;
    setError('');
    if (pasi.trim().length < 20) {
      setError('Planul „Cum evităm pe viitor" necesită min. 20 caractere.');
      return;
    }
    const fileInput = document.getElementById('error-doc') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    const created = addErrorCase({
      angajatId,
      raportatDe: user.id,
      raportatDeNume: user.name,
      data: new Date().toISOString().slice(0, 10),
      proiectNume: proiectNume || undefined,
      motiv,
      descriere: descriere.trim(),
      planActiune: {
        pasi: pasi.trim(),
        responsabilId: responsabilId || user.id,
        termenLimita: termenLimita || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: 'deschis',
      },
    });

    if (file) {
      await uploadDocument({
        file,
        tip: 'nota_constatare',
        angajatId,
        uploadedBy: user.id,
        uploadedByNume: user.name,
        errorCaseId: created.id,
      });
    }

    setShowForm(false);
    setDescriere('');
    setPasi('');
    setProiectNume('');
    setSuccess('Eroare înregistrată cu plan de acțiune.');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-xs text-corporate-muted uppercase">Erori luna curentă</p>
          <p className="text-2xl font-bold">{eroriLuna}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-corporate-muted uppercase">Planuri acțiune deschise</p>
          <p className="text-2xl font-bold text-amber-600">{planuriDeschise}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-corporate-muted uppercase">Total înregistrate</p>
          <p className="text-2xl font-bold">{errorCases.length}</p>
        </Card>
      </div>

      {trend.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-corporate-dark mb-2">Trend erori (lunar)</h2>
          <p className="text-xs text-corporate-muted mb-3">
            Scăderea indică eficiența instruirii și a planurilor de acțiune.
          </p>
          <KpiTrendChart snapshots={trend} />
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-corporate-dark">Management erori & performanță</h2>
            <p className="text-sm text-corporate-muted">Clasificare, documentație, plan de acțiune.</p>
          </div>
          <Button type="button" variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Închide formular' : '+ Înregistrare eroare'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 mb-6 p-4 rounded-xl bg-corporate-surface">
            <label className="block text-sm sm:col-span-2">
              <span className="text-corporate-muted">Angajat *</span>
              <select
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                value={angajatId}
                onChange={(e) => setAngajatId(e.target.value)}
                required
              >
                <option value="">Selectează…</option>
                {profiles.map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.prenume} {p.nume}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Proiect" value={proiectNume} onChange={(e) => setProiectNume(e.target.value)} />
            <label className="block text-sm">
              <span className="text-corporate-muted">Motiv *</span>
              <select
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                value={motiv}
                onChange={(e) => setMotiv(e.target.value as ErrorMotiv)}
              >
                {Object.entries(ERROR_MOTIV_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-corporate-muted">Descriere *</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[60px]"
                value={descriere}
                onChange={(e) => setDescriere(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-corporate-muted">Cum evităm pe viitor *</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[80px]"
                value={pasi}
                onChange={(e) => setPasi(e.target.value)}
                required
                placeholder="Pași concreți, responsabilități, proceduri de urmat…"
              />
            </label>
            <label className="block text-sm">
              <span className="text-corporate-muted">Responsabil plan</span>
              <select
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                value={responsabilId}
                onChange={(e) => setResponsabilId(e.target.value)}
              >
                <option value="">Implicit (dvs.)</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Termen plan acțiune"
              type="date"
              value={termenLimita}
              onChange={(e) => setTermenLimita(e.target.value)}
            />
            <label className="block text-sm sm:col-span-2">
              <span className="text-corporate-muted">Notă constatare (scan PDF/imagine)</span>
              <input id="error-doc" type="file" accept=".pdf,.jpg,.jpeg,.png" className="mt-1 block text-sm" />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary">
                Salvează eroarea
              </Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-corporate-border text-left text-corporate-muted">
                <th className="py-2 pr-3">Data</th>
                <th className="py-2 pr-3">Angajat</th>
                <th className="py-2 pr-3">Motiv</th>
                <th className="py-2 pr-3">Proiect</th>
                <th className="py-2 pr-3">Plan acțiune</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {errorCases.slice(0, 50).map((err) => {
                const ang = users.find((u) => u.id === err.angajatId);
                return (
                  <tr key={err.id} className="border-b border-corporate-border/60 align-top">
                    <td className="py-2 pr-3 text-corporate-muted">{err.data}</td>
                    <td className="py-2 pr-3 font-medium">{ang?.name ?? err.angajatId}</td>
                    <td className="py-2 pr-3">{ERROR_MOTIV_LABELS[err.motiv]}</td>
                    <td className="py-2 pr-3 text-corporate-muted">{err.proiectNume ?? '—'}</td>
                    <td className="py-2 pr-3 text-xs max-w-[200px]">{err.planActiune.pasi}</td>
                    <td className="py-2">
                      <select
                        className="rounded border border-corporate-border text-xs px-1 py-0.5"
                        value={err.planActiune.status}
                        onChange={(e) =>
                          updateErrorCase(err.id, {
                            planActiune: {
                              ...err.planActiune,
                              status: e.target.value as 'deschis' | 'in_lucru' | 'inchis',
                              inchisLa:
                                e.target.value === 'inchis'
                                  ? new Date().toISOString()
                                  : undefined,
                            },
                          })
                        }
                      >
                        <option value="deschis">Deschis</option>
                        <option value="in_lucru">În lucru</option>
                        <option value="inchis">Închis</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
  );
}
