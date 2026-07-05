import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useUsers } from '@/context/UsersContext';
import { storage } from '@/store/storage';
import { buildTraineeHrReport } from '@/lib/hrReport';
import {
  EVALUATION_STATUS_LABELS,
  hrPerformanceStore,
} from '@/lib/hrPerformanceStore';
import { getEmployeeMentorAssignments } from '@/lib/employeeMentorAssignments';
import { WeeklyInstruireMentorCell } from '@/components/admin/performance/WeeklyInstruireMentorCell';
import { RE_TRAINING_STATUS_LABELS, normalizeReTrainingStatus } from '@/lib/reTrainingWorkflow';
import { ingineriPath } from '@/data/departments';
import { getEvaluationWorkflowLabel } from '@/lib/evaluationStages';
import { CertificateTableCell } from '@/components/certificate/CertificateTableCell';
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
        const evalCurrent = hrPerformanceStore.getCurrentEvaluation(p.userId);
        const trainee = allTrainees.find((t) => t.id === p.userId);
        let trainingProgress: string | null = null;
        if (trainee && p.tipAngajat === 'incepator') {
          const row = buildTraineeHrReport(trainee, storage.getProgress(p.userId));
          trainingProgress = `${row.progressPercent}%`;
        }
        const mentorsInfo = getEmployeeMentorAssignments(p, users);
        const days = evalCurrent ? hrPerformanceStore.daysUntil(evalCurrent.termenReevaluare) : null;
        const trainingProgressData =
          trainee && p.tipAngajat === 'incepator' ? storage.getProgress(p.userId) : null;
        const trainingRow =
          trainee && p.tipAngajat === 'incepator'
            ? buildTraineeHrReport(trainee, storage.getProgress(p.userId))
            : null;
        return {
          profile: p,
          evalCurrent,
          trainingProgress,
          trainingProgressData,
          trainingRow,
          mentors: mentorsInfo,
          days,
        };
      })
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const full = `${r.profile.prenume} ${r.profile.nume} ${r.profile.functie}`.toLowerCase();
        const names = [r.mentors.supervizor.name, r.mentors.instruire.name].join(' ');
        return full.includes(q) || names.toLowerCase().includes(q);
      });
  }, [profiles, users, allTrainees, evaluations, search]);

  const reTrainingCount = rows.filter((r) => r.mentors.reInstruire.active).length;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-corporate-dark">Departamentul de Ingineri</h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Căutare Departamentul de Ingineri"
            aria-label="Căutare Departamentul de Ingineri"
            className="w-full sm:w-72 rounded-xl border border-corporate-border bg-white px-4 py-2.5 text-sm placeholder:text-corporate-muted/70 focus:border-corporate-gold focus:outline-none focus:ring-2 focus:ring-corporate-gold/25"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="border-b border-corporate-border text-left text-corporate-muted">
                <th className="py-2 pr-3">Angajat</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Instruire</th>
                <th className="py-2 pr-3">Certificat</th>
                <th className="py-2 pr-3 min-w-[140px]">Mentor principal</th>
                <th className="py-2 pr-3 min-w-[160px]">Supervizor</th>
                <th className="py-2 pr-3">Evaluare 90z</th>
                <th className="py-2 pr-3">Etapa evaluare</th>
                <th className="py-2 pr-3">Re-instruire</th>
                <th className="py-2">Fișă</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ profile, evalCurrent, trainingProgress, trainingProgressData, trainingRow, mentors, days }) => (
                <tr key={profile.userId} className="border-b border-corporate-border/60 align-top">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-corporate-dark">
                      {profile.prenume} {profile.nume}
                    </p>
                    <p className="text-xs text-corporate-muted">{profile.functie}</p>
                  </td>
                  <td className="py-2.5 pr-3">
                    {profile.status === 'in_reinstruire' ? (
                      <Badge variant="warning">În re-instruire</Badge>
                    ) : (
                      <Badge variant="success">Activ</Badge>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    {trainingProgress ?? <span className="text-xs text-corporate-muted">N/A</span>}
                  </td>
                  <td className="py-2.5 pr-3">
                    {trainingRow ? (
                      <CertificateTableCell
                        userId={profile.userId}
                        issued={trainingRow.certificateIssued}
                      />
                    ) : (
                      <span className="text-xs text-corporate-muted">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    <WeeklyInstruireMentorCell
                      profile={profile}
                      progress={trainingProgressData}
                      inTraining={mentors.instruire.active || profile.tipAngajat === 'incepator'}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <p className="text-xs font-medium text-corporate-dark">{mentors.supervizor.name}</p>
                    <p className="text-[10px] text-corporate-muted mt-0.5">Modificare în Setări</p>
                  </td>
                  <td className="py-2.5 pr-3">
                    {evalCurrent ? (
                      <>
                        <Badge variant={evalBadgeVariant(evalCurrent.status)} className="mb-1">
                          {EVALUATION_STATUS_LABELS[evalCurrent.status]}
                        </Badge>
                        <p
                          className={`text-xs ${days !== null && days <= 7 && evalCurrent.status !== 'evaluat' ? 'text-amber-600 font-medium' : 'text-corporate-muted'}`}
                        >
                          {evalCurrent.termenReevaluare}
                        </p>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-corporate-muted">
                    {evalCurrent ? getEvaluationWorkflowLabel(evalCurrent) : '—'}
                  </td>
                  <td className="py-2.5 pr-3">
                    {mentors.reInstruire.active ? (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-corporate-dark">{mentors.reInstruire.name}</p>
                        {mentors.reInstruire.status ? (
                          <Badge variant="warning">
                            {RE_TRAINING_STATUS_LABELS[normalizeReTrainingStatus(mentors.reInstruire.status as 'alerta_supervizor')]}
                          </Badge>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-corporate-muted">—</span>
                    )}
                  </td>
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
        </div>
      </Card>

      <Card padding="sm" className="border-corporate-gold/20 bg-corporate-gold-light/20">
        <p className="text-xs text-corporate-stone">
          <strong>{profiles.length}</strong> angajați ·{' '}
          <strong>{reTrainingCount}</strong> în re-instruire activă · Flux complet în tab{' '}
          <strong>Supervizor</strong>
        </p>
      </Card>
    </div>
  );
}
