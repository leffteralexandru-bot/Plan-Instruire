import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUsers } from '@/context/UsersContext';
import { COHORTS, getActiveCohort } from '@/data/cohorts';
import { DEPARTMENTS, ingineriPath } from '@/data/departments';
import type { UserRole } from '@/types';
import { hasRole } from '@/lib/roles';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { EmployeeEvaluationSettingsEditor } from '@/components/admin/EmployeeEvaluationSettingsEditor';
import { EmployeePlanningSettings } from '@/components/admin/EmployeePlanningSettings';
import { TestingHighlightZone } from '@/components/shared/TestingHighlightZone';
import { TrainingPlanEditor } from '@/components/admin/TrainingPlanEditor';
import { OperationalGuideEditor } from '@/components/operational/OperationalGuideEditor';
import { TechnicalRepositoryEditor } from '@/components/technicalRepository/TechnicalRepositoryEditor';
import { EquipmentOperationsEditor } from '@/components/equipment/EquipmentOperationsEditor';
import { DEFAULT_PLATFORM_PASSWORD } from '@/lib/credentials';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { EVALUATION_WEEK_LABELS } from '@/lib/evaluationWeekMentors';
import { PLATFORM_SETTINGS_ADMIN_NAME } from '@/lib/platformSettingsAdmin';
import { SearchablePersonSelect } from '@/components/shared/SearchablePersonSelect';

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
  const { mentors, users, mentorCandidates, createUser, createEnrollment } = useUsers();
  const { user } = useAuth();
  const { canEditTrainingPlan, canViewPlatformSettings } = useAccessControl();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [repoOpen, setRepoOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [editDirty, setEditDirty] = useState(false);

  const [wizardName, setWizardName] = useState('');
  const [wizardEmail, setWizardEmail] = useState('');
  const [wizardPassword, setWizardPassword] = useState(DEFAULT_PLATFORM_PASSWORD);
  const [wizardFunctie, setWizardFunctie] = useState('Inginer producție');
  const [wizardMentorId, setWizardMentorId] = useState('');
  const [wizardSupervisorId, setWizardSupervisorId] = useState('');
  const [wizardCohortId, setWizardCohortId] = useState(getActiveCohort().id);
  const [wizardDeptId, setWizardDeptId] = useState('ingineri');
  const [wizardStart, setWizardStart] = useState('2026-06-01');
  const [wizardWeeklyMode, setWizardWeeklyMode] = useState(false);
  const [wizardGrantMentor, setWizardGrantMentor] = useState(false);
  const [wizardWeeks, setWizardWeeks] = useState<Record<number, string>>({});

  const supervisorOptions = mentors.length > 0 ? mentors : users.filter((u) => u.active);
  const principalWizardName = mentorCandidates.find((m) => m.id === wizardMentorId)?.name;
  const changedBy = user ? { id: user.id, name: user.name } : undefined;

  const flash = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const resetWizardForm = () => {
    setWizardName('');
    setWizardEmail('');
    setWizardPassword(DEFAULT_PLATFORM_PASSWORD);
    setWizardFunctie('Inginer producție');
    setWizardMentorId('');
    setWizardSupervisorId('');
    setWizardWeeklyMode(false);
    setWizardGrantMentor(false);
    setWizardWeeks({});
  };

  const handleCancelWizard = () => {
    resetWizardForm();
    setWizardOpen(false);
    setError('');
  };

  const closeEditPanel = () => {
    setEditOpen(false);
    setEditDirty(false);
  };

  const closeOtherPanels = (except?: 'new' | 'edit' | 'plan' | 'guide' | 'repo' | 'equipment' | 'evaluation') => {
    if (except !== 'new' && wizardOpen) handleCancelWizard();
    if (except !== 'edit' && editOpen) {
      if (editDirty) {
        const ok = window.confirm(
          'Aveți modificări nesalvate. Doriți să continuați fără salvare?',
        );
        if (!ok) return false;
      }
      closeEditPanel();
    }
    if (except !== 'plan' && planOpen) setPlanOpen(false);
    if (except !== 'guide' && guideOpen) setGuideOpen(false);
    if (except !== 'repo' && repoOpen) setRepoOpen(false);
    if (except !== 'equipment' && equipmentOpen) setEquipmentOpen(false);
    if (except !== 'evaluation' && evaluationOpen) setEvaluationOpen(false);
    return true;
  };

  const handleToggleWizard = () => {
    if (wizardOpen) {
      handleCancelWizard();
      return;
    }
    if (!closeOtherPanels('new')) return;
    setWizardOpen(true);
  };

  const handleToggleEdit = () => {
    if (editOpen) {
      if (editDirty) {
        const ok = window.confirm(
          'Aveți modificări nesalvate. Doriți să închideți fără salvare?',
        );
        if (!ok) return;
      }
      closeEditPanel();
      return;
    }
    if (!closeOtherPanels('edit')) return;
    setEditOpen(true);
  };

  const handleTogglePlan = () => {
    if (planOpen) {
      setPlanOpen(false);
      return;
    }
    if (!closeOtherPanels('plan')) return;
    setPlanOpen(true);
  };

  const handleToggleGuide = () => {
    if (guideOpen) {
      setGuideOpen(false);
      return;
    }
    if (!closeOtherPanels('guide')) return;
    setGuideOpen(true);
  };

  const handleToggleRepo = () => {
    if (repoOpen) {
      setRepoOpen(false);
      return;
    }
    if (!closeOtherPanels('repo')) return;
    setRepoOpen(true);
  };

  const handleToggleEquipment = () => {
    if (equipmentOpen) {
      setEquipmentOpen(false);
      return;
    }
    if (!closeOtherPanels('equipment')) return;
    setEquipmentOpen(true);
  };

  const handleToggleEvaluation = () => {
    if (evaluationOpen) {
      setEvaluationOpen(false);
      return;
    }
    if (!closeOtherPanels('evaluation')) return;
    setEvaluationOpen(true);
  };

  const handleWizardCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (!wizardMentorId) throw new Error('Selectați mentorul principal.');
      if (!wizardSupervisorId) throw new Error('Selectați supervizorul.');
      const created = createUser({
        name: wizardName,
        email: wizardEmail,
        roles: buildStaffRoles('angajat', wizardGrantMentor),
        password: wizardPassword,
      });
      createEnrollment({
        angajatId: created.id,
        mentorId: wizardMentorId,
        cohortId: wizardCohortId,
        departmentId: wizardDeptId as 'ingineri',
        programStart: wizardStart,
      });
      hrPerformanceStore.updateProfile(created.id, {
        functie: wizardFunctie.trim() || 'Inginer',
        departamentId: wizardDeptId as 'ingineri',
      });
      hrPerformanceStore.setSupervisor(created.id, wizardSupervisorId, changedBy);
      if (wizardWeeklyMode) {
        for (const { weekNumber } of EVALUATION_WEEK_LABELS) {
          const mentorId = wizardWeeks[weekNumber];
          if (mentorId) hrPerformanceStore.setWeeklyEvalMentor(created.id, weekNumber, mentorId);
        }
      }
      resetWizardForm();
      setWizardOpen(false);
      flash('Angajat adăugat, supervizor și mentorii planificați, înscrierea creată.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la creare angajat.');
    }
  };

  return (
    <div className="space-y-6">
      <TestingHighlightZone zoneId="zone-hr-planning">
      <Card>
        {!canEditTrainingPlan && canViewPlatformSettings && (
          <p className="text-sm text-corporate-muted mb-3 rounded-lg border border-corporate-border bg-corporate-surface/50 px-3 py-2">
            Puteți consulta planul de instruire, evaluarea și conținutul tehnic (doar vizualizare).
            Modificările se fac doar din contul{' '}
            <strong className="text-corporate-dark">{PLATFORM_SETTINGS_ADMIN_NAME}</strong>.
          </p>
        )}
        <nav
          aria-label="Acțiuni angajat"
          id="action-focus-settings"
          className="flex gap-1 overflow-x-auto rounded-xl border border-corporate-border bg-white p-1"
        >
          <button
            type="button"
            onClick={handleToggleWizard}
            className={[
              'shrink-0 rounded-lg px-3 py-2 text-left transition-colors min-w-[7rem]',
              wizardOpen
                ? 'bg-corporate-black text-white shadow-sm'
                : 'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-dark',
            ].join(' ')}
          >
            <span className="block text-sm font-medium">Angajat nou</span>
            <span
              className={[
                'block text-[10px] mt-0.5',
                wizardOpen ? 'text-white/60' : 'text-corporate-muted/80',
              ].join(' ')}
            >
              Date, mentor & supervizor
            </span>
          </button>
          {canViewPlatformSettings && (
          <button
            type="button"
            onClick={handleToggleEvaluation}
            className={[
              'shrink-0 rounded-lg px-3 py-2 text-left transition-colors min-w-[7rem]',
              evaluationOpen
                ? 'bg-corporate-black text-white shadow-sm'
                : 'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-dark',
            ].join(' ')}
          >
            <span className="block text-sm font-medium">Evaluare angajaților</span>
            <span
              className={[
                'block text-[10px] mt-0.5',
                evaluationOpen ? 'text-white/60' : 'text-corporate-muted/80',
              ].join(' ')}
            >
              Ciclu & test competențe
            </span>
          </button>
          )}
          <button
            type="button"
            onClick={handleToggleEdit}
            className={[
              'shrink-0 rounded-lg px-3 py-2 text-left transition-colors min-w-[7rem]',
              editOpen
                ? 'bg-corporate-black text-white shadow-sm'
                : 'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-dark',
            ].join(' ')}
          >
            <span className="block text-sm font-medium">Mentor & supervizor</span>
            <span
              className={[
                'block text-[10px] mt-0.5',
                editOpen ? 'text-white/60' : 'text-corporate-muted/80',
              ].join(' ')}
            >
              Modificare angajat
            </span>
          </button>
          {canViewPlatformSettings && (
          <>
          <button
            type="button"
            onClick={handleTogglePlan}
            className={[
              'shrink-0 rounded-lg px-3 py-2 text-left transition-colors min-w-[7rem]',
              planOpen
                ? 'bg-corporate-black text-white shadow-sm'
                : 'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-dark',
            ].join(' ')}
          >
            <span className="block text-sm font-medium">Plan instruire</span>
            <span
              className={[
                'block text-[10px] mt-0.5',
                planOpen ? 'text-white/60' : 'text-corporate-muted/80',
              ].join(' ')}
            >
              Conținut zilnic
            </span>
          </button>
          <button
            type="button"
            onClick={handleToggleGuide}
            className={[
              'shrink-0 rounded-lg px-3 py-2 text-left transition-colors min-w-[7rem]',
              guideOpen
                ? 'bg-corporate-black text-white shadow-sm'
                : 'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-dark',
            ].join(' ')}
          >
            <span className="block text-sm font-medium">Ghid Operațional</span>
            <span
              className={[
                'block text-[10px] mt-0.5',
                guideOpen ? 'text-white/60' : 'text-corporate-muted/80',
              ].join(' ')}
            >
              Pași măsurare teren
            </span>
          </button>
          <button
            type="button"
            onClick={handleToggleRepo}
            className={[
              'shrink-0 rounded-lg px-3 py-2 text-left transition-colors min-w-[7rem]',
              repoOpen
                ? 'bg-corporate-black text-white shadow-sm'
                : 'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-dark',
            ].join(' ')}
          >
            <span className="block text-sm font-medium">Repository Tehnic</span>
            <span
              className={[
                'block text-[10px] mt-0.5',
                repoOpen ? 'text-white/60' : 'text-corporate-muted/80',
              ].join(' ')}
            >
              Produse · materiale · garanție
            </span>
          </button>
          <button
            type="button"
            onClick={handleToggleEquipment}
            className={[
              'shrink-0 rounded-lg px-3 py-2 text-left transition-colors min-w-[7rem]',
              equipmentOpen
                ? 'bg-corporate-black text-white shadow-sm'
                : 'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-dark',
            ].join(' ')}
          >
            <span className="block text-sm font-medium">Mentenanță echipament</span>
            <span
              className={[
                'block text-[10px] mt-0.5',
                equipmentOpen ? 'text-white/60' : 'text-corporate-muted/80',
              ].join(' ')}
            >
              Curățare · utilizare · CAD
            </span>
          </button>
          </>
          )}
        </nav>

        {wizardOpen && (
          <>
            <p className="text-sm text-corporate-muted mt-4 mb-4">
              Completați datele angajatului, contul de acces, mentorul principal, supervizorul și opțional
              mentorii pe săptămâni.
            </p>
            <form onSubmit={handleWizardCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Nume angajat" value={wizardName} onChange={(e) => setWizardName(e.target.value)} required />
          <Input label="Funcție" value={wizardFunctie} onChange={(e) => setWizardFunctie(e.target.value)} required />
          <Input
            label="Email profil"
            type="email"
            value={wizardEmail}
            onChange={(e) => setWizardEmail(e.target.value)}
            required
          />
          <Input
            label="Parolă inițială"
            type="password"
            value={wizardPassword}
            onChange={(e) => setWizardPassword(e.target.value)}
            required
          />
          <label className="block text-sm">
            <span className="text-corporate-muted">Mentor principal (implicit S1–S4) — orice angajat</span>
            <SearchablePersonSelect
              value={wizardMentorId}
              options={mentorCandidates}
              onChange={setWizardMentorId}
              placeholder="Caută mentor după nume…"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-corporate-muted">Supervizor</span>
            <SearchablePersonSelect
              value={wizardSupervisorId}
              options={supervisorOptions}
              onChange={setWizardSupervisorId}
              placeholder="Caută supervizor după nume…"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-corporate-muted">Grupă instruire</span>
            <select
              className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
              value={wizardCohortId}
              onChange={(e) => setWizardCohortId(e.target.value)}
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
              value={wizardDeptId}
              onChange={(e) => setWizardDeptId(e.target.value)}
            >
              {DEPARTMENTS.filter((d) => d.planAvailable).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <Input label="Start program" type="date" value={wizardStart} onChange={(e) => setWizardStart(e.target.value)} required />
          <div className="flex flex-col justify-end gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-corporate-muted">
              <input
                type="checkbox"
                checked={wizardWeeklyMode}
                onChange={(e) => setWizardWeeklyMode(e.target.checked)}
              />
              Mentor diferit pe săptămâni
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-corporate-muted">
              <input
                type="checkbox"
                checked={wizardGrantMentor}
                onChange={(e) => setWizardGrantMentor(e.target.checked)}
              />
              Oferă și statut mentor temporar
            </label>
            <Button type="submit" variant="primary">Crearea angajat</Button>
            <Button type="button" variant="ghost" onClick={handleCancelWizard}>
              Anulează
            </Button>
          </div>
          {wizardWeeklyMode && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-corporate-border bg-corporate-surface p-3">
              <p className="text-xs text-corporate-muted mb-2">
                Dacă lăsați gol, rămâne mentorul principal selectat mai sus.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {EVALUATION_WEEK_LABELS.map(({ weekNumber, title }) => (
                  <div key={weekNumber} className="block text-sm">
                    <span className="text-corporate-muted text-xs">S{weekNumber} — {title}</span>
                    <SearchablePersonSelect
                      value={wizardWeeks[weekNumber] ?? ''}
                      options={mentorCandidates}
                      onChange={(mentorId) =>
                        setWizardWeeks((prev) => ({ ...prev, [weekNumber]: mentorId }))
                      }
                      placeholder="Caută mentor…"
                      allowEmpty
                      emptyLabel={
                        principalWizardName
                          ? `Implicit: ${principalWizardName}`
                          : 'Implicit (mentor principal)'
                      }
                      resetKey={`wizard-s${weekNumber}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
            </form>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </>
        )}
        {success && !wizardOpen && !editOpen && !planOpen && !guideOpen && !repoOpen && !equipmentOpen && !evaluationOpen && (
          <p className="text-sm text-emerald-600 mt-3">{success}</p>
        )}

        {editOpen && (
          <EmployeePlanningSettings
            embedded
            onDirtyChange={setEditDirty}
            onComplete={closeEditPanel}
          />
        )}

        {planOpen && canViewPlatformSettings && <TrainingPlanEditor embedded />}
        {guideOpen && canViewPlatformSettings && <OperationalGuideEditor embedded />}
        {repoOpen && canViewPlatformSettings && <TechnicalRepositoryEditor embedded />}
        {equipmentOpen && canViewPlatformSettings && <EquipmentOperationsEditor embedded />}
        {evaluationOpen && canViewPlatformSettings && <EmployeeEvaluationSettingsEditor embedded />}
      </Card>
      </TestingHighlightZone>

      <Card padding="sm" className="border-corporate-gold/20 bg-corporate-gold-light/10">
        <p className="text-sm text-corporate-muted">
          Pentru <strong>statut mentor temporar</strong> și vederea completă „cine e mentor pentru cine”,
          mergeți la{' '}
          <Link to={ingineriPath('/mentor')} className="text-corporate-gold font-medium hover:underline">
            Panou Mentor
          </Link>
          .
        </p>
      </Card>
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
