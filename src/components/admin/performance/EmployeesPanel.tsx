import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { storage } from '@/store/storage';
import { buildTraineeHrReport } from '@/lib/hrReport';
import { getDepartmentById } from '@/data/departments';
import {
  EVALUATION_STATUS_LABELS,
  hrPerformanceStore,
} from '@/lib/hrPerformanceStore';
import { ingineriPath } from '@/data/departments';
import type { EvaluationStatus } from '@/types';

function evalBadgeVariant(status: EvaluationStatus): 'success' | 'warning' | 'default' {
  if (status === 'evaluat') return 'success';
  if (status === 'intarziat') return 'warning';
  return 'default';
}

export function EmployeesPanel() {
  const { profiles, evaluations } = useHrPerformance();
  const { users, allTrainees } = useUsers();
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    return profiles
      .map((p) => {
        const user = users.find((u) => u.id === p.userId);
        const evalCurrent = hrPerformanceStore.getCurrentEvaluation(p.userId);
        const trainee = allTrainees.find((t) => t.id === p.userId);
        let trainingProgress: string | null = null;
        if (trainee && p.tipAngajat === 'incepator') {
          const row = buildTraineeHrReport(trainee, storage.getProgress(p.userId));
          trainingProgress = `${row.progressPercent}%`;
        }
        const manager = users.find((u) => u.id === p.managerId);
        const days = evalCurrent ? hrPerformanceStore.daysUntil(evalCurrent.termenReevaluare) : null;
        return {
          profile: p,
          user,
          evalCurrent,
          trainingProgress,
          managerName: manager?.name ?? '—',
          days,
        };
      })
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const full = `${r.profile.prenume} ${r.profile.nume} ${r.profile.functie}`.toLowerCase();
        return full.includes(q);
      });
  }, [profiles, users, allTrainees, evaluations, search]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-corporate-dark">Modul Angajați</h2>
            <p className="text-sm text-corporate-muted mt-1">
              Baza de date HR — profil, evaluare, instruire, erori.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Input
              label="Căutare"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nume, funcție…"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-corporate-border text-left text-corporate-muted">
                <th className="py-2 pr-3">Angajat</th>
                <th className="py-2 pr-3">Funcție</th>
                <th className="py-2 pr-3">Angajare</th>
                <th className="py-2 pr-3">Status evaluare</th>
                <th className="py-2 pr-3">Termen</th>
                <th className="py-2 pr-3">Instruire</th>
                <th className="py-2 pr-3">Evaluator</th>
                <th className="py-2">Fișă</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ profile, evalCurrent, trainingProgress, managerName, days }) => (
                <tr key={profile.userId} className="border-b border-corporate-border/60">
                  <td className="py-2.5 pr-3 font-medium">
                    {profile.prenume} {profile.nume}
                  </td>
                  <td className="py-2.5 pr-3 text-corporate-muted">{profile.functie}</td>
                  <td className="py-2.5 pr-3 text-corporate-muted">{profile.dataAngajarii}</td>
                  <td className="py-2.5 pr-3">
                    {evalCurrent ? (
                      <Badge variant={evalBadgeVariant(evalCurrent.status)}>
                        {EVALUATION_STATUS_LABELS[evalCurrent.status]}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    {evalCurrent ? (
                      <span
                        className={
                          days !== null && days <= 7 && evalCurrent.status !== 'evaluat'
                            ? 'text-amber-600 font-medium'
                            : 'text-corporate-muted'
                        }
                      >
                        {evalCurrent.termenReevaluare}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    {trainingProgress ? (
                      <span className="text-corporate-dark">{trainingProgress}</span>
                    ) : (
                      <span className="text-corporate-muted text-xs">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-corporate-muted">{managerName}</td>
                  <td className="py-2.5">
                    <Link
                      to={ingineriPath(`/angajat/${profile.userId}`)}
                      className="text-corporate-gold text-xs font-medium hover:underline"
                    >
                      Deschide →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="text-sm text-corporate-muted py-6 text-center">Niciun angajat găsit.</p>
          )}
        </div>
      </Card>

      <Card padding="sm" className="border-corporate-gold/20 bg-corporate-gold-light/20">
        <p className="text-xs text-corporate-stone">
          <strong>{profiles.length}</strong> angajați activi · Departamente:{' '}
          {[...new Set(profiles.map((p) => getDepartmentById(p.departamentId)?.label))].join(', ')}
        </p>
      </Card>
    </div>
  );
}
