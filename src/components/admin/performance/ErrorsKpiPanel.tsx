import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RegisterErrorCaseForm } from '@/components/shared/RegisterErrorCaseForm';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { ERROR_MOTIV_LABELS } from '@/lib/hrPerformanceStore';

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
  const { errorCases, kpiSnapshots, updateErrorCase, profiles } = useHrPerformance();
  const { users } = useUsers();
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState('');

  const luna = new Date().toISOString().slice(0, 7);
  const eroriLuna = errorCases.filter((e) => e.data.startsWith(luna)).length;
  const planuriDeschise = errorCases.filter((e) => e.planActiune.status !== 'inchis').length;

  const trend = useMemo(
    () => kpiSnapshots.slice(-6).map((s) => ({ luna: s.luna, eroriLuna: s.eroriLuna })),
    [kpiSnapshots],
  );

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
          <div className="mb-6">
            <RegisterErrorCaseForm
              profiles={profiles}
              onSuccess={(msg) => {
                setShowForm(false);
                setSuccess(msg);
              }}
            />
          </div>
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

      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
  );
}
