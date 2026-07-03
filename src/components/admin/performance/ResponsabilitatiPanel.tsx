import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { ingineriPath } from '@/data/departments';
import {
  buildResponsibilityRows,
  filterResponsibilityRows,
  listMentorFilterOptions,
  listSupervisorFilterOptions,
} from '@/lib/responsibilityOverview';

export function ResponsabilitatiPanel() {
  const { profiles } = useHrPerformance();
  const { users } = useUsers();
  const [mentorId, setMentorId] = useState('all');
  const [supervisorId, setSupervisorId] = useState('all');
  const [search, setSearch] = useState('');

  const allRows = useMemo(() => buildResponsibilityRows(profiles, users), [profiles, users]);
  const mentorOptions = useMemo(() => listMentorFilterOptions(allRows), [allRows]);
  const supervisorOptions = useMemo(() => listSupervisorFilterOptions(allRows), [allRows]);

  const rows = useMemo(
    () => filterResponsibilityRows(allRows, { mentorId, supervisorId, search }),
    [allRows, mentorId, supervisorId, search],
  );

  const pendingValidationsTotal = rows.reduce((n, r) => n + r.pendingValidations, 0);
  const activeReTraining = rows.filter((r) => r.reTrainingLabel).length;

  return (
    <div className="space-y-4">
      <Card padding="sm">
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Responsabilități — mentor & supervizor</h2>
        <p className="text-sm text-corporate-muted mb-4">
          Vedere unică: cine răspunde de cine, progres instruire, etapa evaluării și re-instruire activă.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <Stat label="Angajați" value={String(rows.length)} />
          <Stat label="Validări pending" value={String(pendingValidationsTotal)} highlight={pendingValidationsTotal > 0} />
          <Stat label="Re-instruire active" value={String(activeReTraining)} highlight={activeReTraining > 0} />
          <Stat label="Mentori activi" value={String(mentorOptions.length)} />
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <label className="text-sm">
            <span className="text-corporate-muted block text-xs mb-1">Filtru mentor</span>
            <select
              className="rounded-lg border border-corporate-border px-3 py-2 text-sm min-w-[160px]"
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
            >
              <option value="all">Toți mentorii</option>
              {mentorOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-corporate-muted block text-xs mb-1">Filtru supervizor</span>
            <select
              className="rounded-lg border border-corporate-border px-3 py-2 text-sm min-w-[160px]"
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
            >
              <option value="all">Toți supervizorii</option>
              {supervisorOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex-1 min-w-[200px]">
            <span className="text-corporate-muted block text-xs mb-1">Căutare</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nume angajat, mentor, supervizor…"
              className="w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr className="border-b border-corporate-border text-left text-corporate-muted text-xs">
                <th className="py-2 pr-3">Angajat</th>
                <th className="py-2 pr-3">Mentor instruire</th>
                <th className="py-2 pr-3">Supervizor</th>
                <th className="py-2 pr-3">Instruire</th>
                <th className="py-2 pr-3">Evaluare 90z</th>
                <th className="py-2 pr-3">Etapa</th>
                <th className="py-2 pr-3">Re-instruire</th>
                <th className="py-2">Fișă</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.angajatId} className="border-b border-corporate-border/60 align-top">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-corporate-dark">{r.angajatName}</p>
                    <p className="text-xs text-corporate-muted">{r.functie}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-xs">{r.mentorName}</td>
                  <td className="py-2.5 pr-3 text-xs">{r.supervisorName}</td>
                  <td className="py-2.5 pr-3">
                    <p className="text-xs">{r.trainingLabel}</p>
                    {r.trainingStatus && (
                      <Badge variant={r.trainingStatus === 'Întârziat' ? 'warning' : 'default'} className="mt-1">
                        {r.trainingStatus}
                      </Badge>
                    )}
                    {r.pendingValidations > 0 && (
                      <p className="text-xs text-amber-700 mt-1">{r.pendingValidations} validări pending</p>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-xs">{r.evaluationStatus ?? '—'}</td>
                  <td className="py-2.5 pr-3 text-xs text-corporate-muted">{r.evaluationStage ?? '—'}</td>
                  <td className="py-2.5 pr-3 text-xs">
                    {r.reTrainingLabel ? (
                      <Badge variant="warning">{r.reTrainingLabel}</Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5">
                    <Link
                      to={ingineriPath(`/angajat/${r.angajatId}`)}
                      className="text-corporate-gold text-xs font-medium hover:underline"
                    >
                      Timeline 360° →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!rows.length && (
          <p className="text-sm text-corporate-muted py-6 text-center">Niciun rezultat pentru filtrele selectate.</p>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-corporate-border px-3 py-2">
      <p className="text-[10px] uppercase text-corporate-muted">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-amber-600' : 'text-corporate-dark'}`}>{value}</p>
    </div>
  );
}
