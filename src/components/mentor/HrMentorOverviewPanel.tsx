import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUsers } from '@/context/UsersContext';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useAuth } from '@/hooks/useAuth';
import { canViewAllTrainees, formatUserRoles, isAngajatUser, isMentorUser } from '@/lib/roles';
import { buildMentorOverviewRows } from '@/lib/mentorOverview';
import { adminPath } from '@/lib/adminRoutes';
import { ingineriPath } from '@/data/departments';

function statusBadgeVariant(label: string): 'success' | 'warning' | 'default' | 'info' {
  if (label === 'Finalizat') return 'success';
  if (label === 'Întârziat' || label === 'Risc moderat') return 'warning';
  if (label === 'Neînceput') return 'default';
  return 'info';
}

/** Vedere HR: cine e mentor, pentru cine, progres și status */
export function HrMentorOverviewPanel() {
  const { user } = useAuth();
  const { mentors, allTrainees, enrollments, users, setMentorStatus } = useUsers();
  const { profiles } = useHrPerformance();

  const overviewRows = useMemo(
    () => buildMentorOverviewRows(mentors, allTrainees, profiles, enrollments),
    [mentors, allTrainees, profiles, enrollments],
  );

  const staffForMentorToggle = useMemo(
    () => users.filter((u) => u.active && isAngajatUser(u) && !u.roles.includes('hr') && !u.roles.includes('admin')),
    [users],
  );

  if (!user || !canViewAllTrainees(user)) return null;

  const grouped = mentors.map((mentor) => ({
    mentor,
    rows: overviewRows.filter((r) => r.mentorId === mentor.id),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Panou HR — Mentori & responsabilități</h2>
        <p className="text-sm text-corporate-muted mb-4">
          Cine este mentor, pentru ce angajat, în ce rol (principal sau săptămână) și cât a rămas până la finalizare.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm min-w-[920px]">
            <thead>
              <tr className="border-b border-corporate-border text-left text-corporate-muted">
                <th className="py-2 pr-3">Mentor</th>
                <th className="py-2 pr-3">Angajat</th>
                <th className="py-2 pr-3">Responsabilitate</th>
                <th className="py-2 pr-3">Progres</th>
                <th className="py-2 pr-3">Rămas</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Fișă</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ mentor, rows }) =>
                rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={`${row.mentorId}-${row.angajatId}-${row.responsibility}`} className="border-b border-corporate-border/60">
                      <td className="py-2 pr-3">
                        {idx === 0 ? (
                          <>
                            <p className="font-medium text-corporate-dark">{row.mentorName}</p>
                            {isAngajatUser(mentor) && (
                              <p className="text-[10px] text-corporate-muted">Mentor temporar</p>
                            )}
                          </>
                        ) : (
                          <span className="text-corporate-muted">↳</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">{row.angajatName}</td>
                      <td className="py-2 pr-3 text-xs">{row.responsibility}</td>
                      <td className="py-2 pr-3 text-xs">
                        {row.completedDays}/{row.totalDays} zile ({row.progressPercent}%)
                      </td>
                      <td className="py-2 pr-3 text-xs">{row.remainingDays} zile</td>
                      <td className="py-2 pr-3">
                        <Badge variant={statusBadgeVariant(row.statusLabel)}>{row.statusLabel}</Badge>
                      </td>
                      <td className="py-2">
                        <Link
                          to={ingineriPath(`/angajat/${row.angajatId}`)}
                          className="text-corporate-gold text-xs font-medium hover:underline"
                        >
                          Deschide →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key={mentor.id} className="border-b border-corporate-border/60">
                    <td className="py-2 pr-3 font-medium text-corporate-dark">{mentor.name}</td>
                    <td colSpan={5} className="py-2 pr-3 text-xs text-corporate-muted italic">
                      Fără angajați asignați momentan
                    </td>
                    <td />
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <h3 className="text-sm font-semibold text-corporate-dark mb-2">Statut mentor temporar (angajați)</h3>
        <p className="text-xs text-corporate-muted mb-3">
          Acordați sau retrageți statutul de mentor pentru angajații existenți.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-corporate-border text-left text-corporate-muted">
                <th className="py-2 pr-3">Nume</th>
                <th className="py-2 pr-3">Roluri</th>
                <th className="py-2">Mentor temporar</th>
              </tr>
            </thead>
            <tbody>
              {staffForMentorToggle.map((u) => (
                <tr key={u.id} className="border-b border-corporate-border/60">
                  <td className="py-2 pr-3 font-medium">{u.name}</td>
                  <td className="py-2 pr-3 text-xs">{formatUserRoles(u)}</td>
                  <td className="py-2">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={isMentorUser(u)}
                        onChange={(e) => setMentorStatus(u.id, e.target.checked)}
                      />
                      {isMentorUser(u) ? 'Activ' : 'Inactiv'}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Link to={adminPath('responsabilitati')}>
            <Button type="button" variant="secondary" size="sm">
              Setări — adaugă angajat / planificare
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
