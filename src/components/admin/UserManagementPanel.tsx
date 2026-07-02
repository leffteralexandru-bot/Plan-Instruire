import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUsers } from '@/context/UsersContext';
import { COHORTS } from '@/data/cohorts';
import { DEPARTMENTS } from '@/data/departments';
import type { UserRole } from '@/types';
import { formatUserRoles, hasRole, isAngajatUser, isMentorUser } from '@/lib/roles';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_PLATFORM_PASSWORD } from '@/lib/credentials';

type StaffRole = 'angajat' | 'mentor';

function buildStaffRoles(orgRole: StaffRole, grantMentor: boolean): UserRole[] {
  if (orgRole === 'mentor') return ['mentor'];
  return grantMentor ? ['angajat', 'mentor'] : ['angajat'];
}

/** Administrator — creează doar profile HR */
function AdminHrSection() {
  const { users, createUser, updateUser } = useUsers();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(DEFAULT_PLATFORM_PASSWORD);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hrUsers = useMemo(() => users.filter((u) => u.active && hasRole(u, 'hr')), [users]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      createUser({ name, email, roles: ['hr'], password });
      setName('');
      setEmail('');
      setPassword(DEFAULT_PLATFORM_PASSWORD);
      flash('Profil HR creat. Utilizatorul se autentifică cu email + parolă.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la creare profil HR.');
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Gestionare profile HR</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Ca <strong>Administrator</strong>, creați profile pentru <strong>Resurse Umane</strong>.
        HR va forma apoi angajații, mentorii și înscrierile la instruire.
      </p>

      <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2 mb-6">
        <Input label="Nume HR" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Email profil"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Parolă inițială"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex items-end">
          <Button type="submit" variant="primary" className="w-full">
            Adaugă profil HR
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-corporate-border text-left text-corporate-muted">
              <th className="py-2 pr-3">Nume</th>
              <th className="py-2 pr-3">Email profil</th>
              <th className="py-2">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {hrUsers.map((u) => (
              <tr key={u.id} className="border-b border-corporate-border/60">
                <td className="py-2 pr-3 font-medium">{u.name}</td>
                <td className="py-2 pr-3 text-corporate-muted">{u.email}</td>
                <td className="py-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => updateUser(u.id, { active: false })}>
                    Dezactivează
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {success && <p className="text-sm text-emerald-600 mt-3">{success}</p>}
    </Card>
  );
}

/** HR — creează angajați, mentori, înscrieri */
function HrStaffSection() {
  const { users, mentors, enrollments, allTrainees, createUser, updateUser, createEnrollment, assignMentor, setMentorStatus } =
    useUsers();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(DEFAULT_PLATFORM_PASSWORD);
  const [staffRole, setStaffRole] = useState<StaffRole>('angajat');
  const [grantMentor, setGrantMentor] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [enrAngajatId, setEnrAngajatId] = useState('');
  const [enrMentorId, setEnrMentorId] = useState('');
  const [enrCohortId, setEnrCohortId] = useState(COHORTS[0]?.id ?? '');
  const [enrDeptId, setEnrDeptId] = useState('ingineri');
  const [enrStart, setEnrStart] = useState('2026-06-01');

  const angajatiFaraInscriere = useMemo(() => {
    const enrolled = new Set(enrollments.filter((e) => e.status === 'active').map((e) => e.angajatId));
    return users.filter((u) => isAngajatUser(u) && u.active && !enrolled.has(u.id));
  }, [users, enrollments]);

  const staffUsers = useMemo(
    () => users.filter((u) => u.active && (isAngajatUser(u) || isMentorUser(u)) && !hasRole(u, 'hr') && !hasRole(u, 'admin')),
    [users],
  );

  const flash = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      createUser({
        name,
        email,
        roles: buildStaffRoles(staffRole, grantMentor),
        password,
      });
      setName('');
      setEmail('');
      setPassword(DEFAULT_PLATFORM_PASSWORD);
      setStaffRole('angajat');
      setGrantMentor(false);
      flash('Profil creat. Utilizatorul se autentifică cu email + parolă.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la creare profil.');
    }
  };

  const handleCreateEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      createEnrollment({
        angajatId: enrAngajatId,
        mentorId: enrMentorId,
        cohortId: enrCohortId,
        departmentId: enrDeptId as 'ingineri',
        programStart: enrStart,
      });
      setEnrAngajatId('');
      flash('Înscriere creată — mentor atribuit.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la înscriere.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Gestionare angajați & mentori</h2>
        <p className="text-sm text-corporate-muted mb-4">
          Ca <strong>Resurse Umane</strong>, creați profile pentru angajați. Statutul de{' '}
          <strong>mentor este temporar</strong> — îl acordați/retrageți unui angajat existent când
          instruiește colegi.
        </p>

        <form onSubmit={handleCreateStaff} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <Input label="Nume" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email profil" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Parolă inițială"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label className="block text-sm">
            <span className="text-corporate-muted">Tip</span>
            <select
              className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
              value={staffRole}
              onChange={(e) => {
                const v = e.target.value as StaffRole;
                setStaffRole(v);
                if (v !== 'angajat') setGrantMentor(false);
              }}
            >
              <option value="angajat">Angajat</option>
              <option value="mentor">Mentor (fără instruire proprie)</option>
            </select>
          </label>
          <div className="flex flex-col justify-end gap-2">
            {staffRole === 'angajat' && (
              <label className="flex items-center gap-2 text-sm text-corporate-muted">
                <input type="checkbox" checked={grantMentor} onChange={(e) => setGrantMentor(e.target.checked)} />
                Acordă statut Mentor
              </label>
            )}
            <Button type="submit" variant="primary" className="w-full">
              Adaugă profil
            </Button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-corporate-border text-left text-corporate-muted">
                <th className="py-2 pr-3">Nume</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Roluri</th>
                <th className="py-2 pr-3">Mentor temp.</th>
                <th className="py-2">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {staffUsers.map((u) => {
                const canToggleMentor = isAngajatUser(u);
                return (
                  <tr key={u.id} className="border-b border-corporate-border/60">
                    <td className="py-2 pr-3 font-medium">{u.name}</td>
                    <td className="py-2 pr-3 text-corporate-muted">{u.email}</td>
                    <td className="py-2 pr-3">{formatUserRoles(u)}</td>
                    <td className="py-2 pr-3">
                      {canToggleMentor ? (
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={isMentorUser(u)}
                            onChange={(e) => {
                              try {
                                setMentorStatus(u.id, e.target.checked);
                                flash(e.target.checked ? 'Statut mentor temporar acordat.' : 'Statut mentor retras.');
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'Eroare.');
                              }
                            }}
                          />
                          {isMentorUser(u) ? 'Activ (temp.)' : 'Inactiv'}
                        </label>
                      ) : (
                        <span className="text-xs text-corporate-muted">{isMentorUser(u) ? 'Da' : '—'}</span>
                      )}
                    </td>
                    <td className="py-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => updateUser(u.id, { active: false })}>
                        Dezactivează
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">Înscrieri instruire & mentori</h2>
        <p className="text-sm text-corporate-muted mb-4">
          Pentru fiecare program, alegeți mentorul responsabil (doar persoane cu statut Mentor).
        </p>

        {angajatiFaraInscriere.length > 0 && (
          <form onSubmit={handleCreateEnrollment} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6 p-4 rounded-xl bg-slate-50">
            <label className="block text-sm">
              <span className="text-corporate-muted">Angajat</span>
              <select
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                value={enrAngajatId}
                onChange={(e) => setEnrAngajatId(e.target.value)}
                required
              >
                <option value="">Selectează…</option>
                {angajatiFaraInscriere.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-corporate-muted">Mentor</span>
              <select
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                value={enrMentorId}
                onChange={(e) => setEnrMentorId(e.target.value)}
                required
              >
                <option value="">Selectează…</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-corporate-muted">Grupă instruire</span>
              <select
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                value={enrCohortId}
                onChange={(e) => setEnrCohortId(e.target.value)}
              >
                {COHORTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-corporate-muted">Departament</span>
              <select
                className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                value={enrDeptId}
                onChange={(e) => setEnrDeptId(e.target.value)}
              >
                {DEPARTMENTS.filter((d) => d.planAvailable).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Start program" type="date" value={enrStart} onChange={(e) => setEnrStart(e.target.value)} required />
            <div className="flex items-end">
              <Button type="submit" variant="secondary" className="w-full">
                Creează înscriere
              </Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-corporate-border text-left text-corporate-muted">
                <th className="py-2 pr-3">Angajat</th>
                <th className="py-2 pr-3">Mentor</th>
                <th className="py-2">Start</th>
              </tr>
            </thead>
            <tbody>
              {allTrainees.map((t) => (
                <tr key={t.enrollmentId} className="border-b border-corporate-border/60">
                  <td className="py-2 pr-3 font-medium">{t.name}</td>
                  <td className="py-2 pr-3">
                    <select
                      className="rounded-lg border border-corporate-border px-2 py-1 text-sm"
                      value={t.mentorId}
                      onChange={(e) => {
                        try {
                          assignMentor(t.enrollmentId, e.target.value);
                          flash('Mentor actualizat.');
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Eroare.');
                        }
                      }}
                    >
                      {mentors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 text-corporate-muted">{t.programStart}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
  );
}

export function UserManagementPanel() {
  const { canManageUsers, isAdmin, isHr } = useAuth();

  if (!canManageUsers) return null;

  return (
    <div className="space-y-6">
      {isAdmin && <AdminHrSection />}
      {isHr && <HrStaffSection />}
    </div>
  );
}
