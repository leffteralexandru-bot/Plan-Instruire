import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUsers } from '@/context/UsersContext';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { useAuth } from '@/hooks/useAuth';
import { hrPerformanceStore } from '@/lib/hrPerformanceStore';
import { WeeklyEvalMentorsEditor } from '@/components/admin/performance/WeeklyEvalMentorsEditor';
import {
  AssignmentHistoryList,
  CurrentAssigneeLabel,
} from '@/components/shared/AssignmentHistoryList';
import { SearchablePersonSelect } from '@/components/shared/SearchablePersonSelect';
import { Input } from '@/components/ui/Input';
import { credentials, DEFAULT_PLATFORM_PASSWORD } from '@/lib/credentials';
import { isSupabaseAuthEnabled } from '@/lib/authService';
import { COHORTS } from '@/data/cohorts';
import { DEPARTMENTS, type DepartmentId } from '@/data/departments';
import { isMentorUser } from '@/lib/roles';
import { EVALUATION_WEEK_LABELS } from '@/lib/evaluationWeekMentors';
import type { EmployeeProfile, TrainingEnrollment, User } from '@/types';

const supabaseAuthActive = isSupabaseAuthEnabled();

interface PersonalDataDraft {
  name: string;
  functie: string;
  email: string;
  newPassword: string;
  cohortId: string;
  departmentId: DepartmentId;
  programStart: string;
  grantMentor: boolean;
}

function splitName(fullName: string): { prenume: string; nume: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { prenume: parts[0] ?? '', nume: '' };
  return { prenume: parts[0], nume: parts.slice(1).join(' ') };
}

function buildPersonalDataDraft(
  profile: EmployeeProfile,
  enrollment: TrainingEnrollment | undefined,
  accountUser: User | undefined,
): PersonalDataDraft {
  return {
    name: accountUser?.name ?? `${profile.prenume} ${profile.nume}`.trim(),
    functie: profile.functie,
    email: accountUser?.email ?? '',
    newPassword: '',
    cohortId: enrollment?.cohortId ?? COHORTS[0]?.id ?? '',
    departmentId: profile.departamentId,
    programStart: enrollment?.programStart ?? profile.dataAngajarii,
    grantMentor: accountUser ? isMentorUser(accountUser) : false,
  };
}

function personalDataEqual(a: PersonalDataDraft, b: PersonalDataDraft): boolean {
  return (
    a.name === b.name &&
    a.functie === b.functie &&
    a.email === b.email &&
    a.cohortId === b.cohortId &&
    a.departmentId === b.departmentId &&
    a.programStart === b.programStart &&
    a.grantMentor === b.grantMentor
  );
}

interface PlanningDraft {
  principalMentorId: string;
  supervisorId: string;
  weeklyMentors: Record<number, string>;
}

function buildPlanningDraft(
  profile: EmployeeProfile,
  enrollment?: TrainingEnrollment,
): PlanningDraft {
  const weeklyMentors: Record<number, string> = {};
  for (const { weekNumber } of EVALUATION_WEEK_LABELS) {
    weeklyMentors[weekNumber] =
      profile.weeklyEvalMentors?.find((w) => w.weekNumber === weekNumber)?.mentorId ?? '';
  }
  return {
    principalMentorId: enrollment?.mentorId ?? '',
    supervisorId: profile.supervisorId ?? profile.managerId ?? '',
    weeklyMentors,
  };
}

function draftsEqual(a: PlanningDraft, b: PlanningDraft): boolean {
  if (a.principalMentorId !== b.principalMentorId || a.supervisorId !== b.supervisorId) {
    return false;
  }
  return EVALUATION_WEEK_LABELS.every(
    ({ weekNumber }) => a.weeklyMentors[weekNumber] === b.weeklyMentors[weekNumber],
  );
}

/** Supervizor, mentor principal și mentori S1–S4 — editare angajați existenți */
export function EmployeePlanningSettings({
  embedded,
  onDirtyChange: onPanelDirtyChange,
  onComplete,
}: {
  embedded?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onComplete?: () => void;
} = {}) {
  const { profiles, refresh } = useHrPerformance();
  const { users, mentors, mentorCandidates, enrollments, assignMentor, resetUserPassword, updateUser, updateEnrollment, setMentorStatus, archiveEmployee } =
    useUsers();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const changedBy = user ? { id: user.id, name: user.name } : undefined;

  const supervisorOptions = mentors.length > 0 ? mentors : users.filter((u) => u.active);

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return profiles
      .filter((p) => {
        const full = `${p.prenume} ${p.nume} ${p.functie}`.toLowerCase();
        return full.includes(q);
      })
      .sort((a, b) =>
        `${a.nume} ${a.prenume}`.localeCompare(`${b.nume} ${b.prenume}`, 'ro'),
      );
  }, [profiles, search]);

  const hasSearchQuery = search.trim().length > 0;

  const selectedProfile = useMemo(() => {
    if (!selectedId) return null;
    return hrPerformanceStore.getProfile(selectedId) ?? profiles.find((p) => p.userId === selectedId) ?? null;
  }, [selectedId, profiles, refresh]);

  const selectedEnrollment = useMemo(() => {
    if (!selectedId) return undefined;
    return enrollments.find((e) => e.angajatId === selectedId && e.status === 'active');
  }, [selectedId, enrollments]);

  const mentorOptionsForSelected = useMemo(() => {
    if (!selectedId) return mentorCandidates;
    return mentorCandidates.filter((m) => m.id !== selectedId);
  }, [mentorCandidates, selectedId]);

  const handleSelectEmployee = (userId: string) => {
    if (editorDirty && selectedId && userId !== selectedId) {
      const ok = window.confirm(
        'Aveți modificări nesalvate. Doriți să continuați fără salvare?',
      );
      if (!ok) return;
    }
    setSelectedId(userId);
    setEditorDirty(false);
    setSaveMessage('');
    setPickerOpen(false);
  };

  const handleSaved = () => {
    refresh();
    setSelectedId(null);
    setEditorDirty(false);
    setSearch('');
    setSaveMessage('Modificările au fost salvate. Căutați un angajat pentru o nouă editare.');
    setTimeout(() => setSaveMessage(''), 4000);
    onComplete?.();
  };

  const handleArchived = () => {
    refresh();
    setSelectedId(null);
    setEditorDirty(false);
    setSearch('');
    setSaveMessage('Angajatul a fost arhivat. Datele rămân salvate, dar nu mai apare în listele active.');
    setTimeout(() => setSaveMessage(''), 5000);
    onComplete?.();
  };

  const handleCancelEdit = () => {
    setSelectedId(null);
    setEditorDirty(false);
    setSearch('');
    setPickerOpen(false);
  };

  useEffect(() => {
    onPanelDirtyChange?.(editorDirty);
  }, [editorDirty, onPanelDirtyChange]);

  const emptyState = (
    <p className="text-sm text-corporate-muted">Niciun profil angajat înregistrat încă.</p>
  );

  const panelContent = (
    <>
      {saveMessage && (
        <p className="text-sm text-emerald-600 mb-3">{saveMessage}</p>
      )}

      <div className="flex justify-end mb-4">
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPickerOpen(true);
              if (!e.target.value.trim()) setSelectedId(null);
            }}
            onFocus={() => {
              if (search.trim()) setPickerOpen(true);
            }}
            placeholder="Căutare Departamentul de Ingineri"
            className="w-full rounded-xl border border-corporate-border bg-white px-4 py-2.5 text-sm placeholder:text-corporate-muted/70 focus:border-corporate-gold focus:outline-none focus:ring-2 focus:ring-corporate-gold/25"
            aria-label="Căutare Departamentul de Ingineri"
            aria-expanded={pickerOpen && hasSearchQuery}
          />
          {pickerOpen && hasSearchQuery && (
            <ul className="absolute z-20 top-full right-0 left-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-corporate-border bg-white shadow-lg p-1">
              {filteredProfiles.length === 0 ? (
                <li className="px-3 py-4 text-xs text-corporate-muted text-center">
                  Niciun rezultat.
                </li>
              ) : (
                filteredProfiles.map((p) => {
                  const active = selectedId === p.userId;
                  return (
                    <li key={p.userId}>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectEmployee(p.userId);
                          setSearch(`${p.prenume} ${p.nume}`.trim());
                          setPickerOpen(false);
                        }}
                        className={[
                          'w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors',
                          active
                            ? 'bg-corporate-gold text-white'
                            : 'text-corporate-dark hover:bg-corporate-surface',
                        ].join(' ')}
                      >
                        <p className="font-medium leading-tight">
                          {p.prenume} {p.nume}
                        </p>
                        <p
                          className={[
                            'text-[10px] mt-0.5 truncate',
                            active ? 'text-white/80' : 'text-corporate-muted',
                          ].join(' ')}
                        >
                          {p.functie}
                        </p>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      </div>

      {selectedProfile && (
        <div className="rounded-xl border border-corporate-border bg-white p-4">
          <EmployeePlanningEditor
            key={selectedProfile.userId}
            profile={selectedProfile}
            enrollment={selectedEnrollment}
            users={users}
            supervisorOptions={supervisorOptions}
            mentorOptions={mentorOptionsForSelected}
            changedBy={changedBy}
            assignMentor={assignMentor}
            resetUserPassword={resetUserPassword}
            updateUser={updateUser}
            updateEnrollment={updateEnrollment}
            setMentorStatus={setMentorStatus}
            archiveEmployee={archiveEmployee}
            onSaved={handleSaved}
            onArchived={handleArchived}
            onCancel={handleCancelEdit}
            onDirtyChange={setEditorDirty}
          />
        </div>
      )}
    </>
  );

  if (profiles.length === 0) {
    if (embedded) return emptyState;
    return (
      <Card>
        <h2 className="text-lg font-semibold text-corporate-dark mb-1">
          Modificarea supervizorului și mentorului angajatului
        </h2>
        {emptyState}
      </Card>
    );
  }

  if (embedded) return panelContent;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">
        Modificarea supervizorului și mentorului angajatului
      </h2>
      {panelContent}
    </Card>
  );
}

function EmployeePlanningEditor({
  profile,
  enrollment,
  users,
  supervisorOptions,
  mentorOptions,
  changedBy,
  assignMentor,
  resetUserPassword,
  updateUser,
  updateEnrollment,
  setMentorStatus,
  archiveEmployee,
  onSaved,
  onArchived,
  onCancel,
  onDirtyChange,
}: {
  profile: EmployeeProfile;
  enrollment?: TrainingEnrollment;
  users: User[];
  supervisorOptions: { id: string; name: string }[];
  mentorOptions: { id: string; name: string }[];
  changedBy?: { id: string; name: string };
  assignMentor: (enrollmentId: string, mentorId: string) => void;
  resetUserPassword: (userId: string, newPassword: string) => void;
  updateUser: (
    id: string,
    patch: Partial<Pick<User, 'name' | 'email' | 'roles' | 'active'>>,
  ) => User;
  updateEnrollment: (
    id: string,
    patch: Partial<
      Pick<TrainingEnrollment, 'mentorId' | 'cohortId' | 'departmentId' | 'programStart' | 'status'>
    >,
  ) => TrainingEnrollment;
  setMentorStatus: (userId: string, enabled: boolean) => User;
  archiveEmployee: (userId: string) => void;
  onSaved: () => void;
  onArchived: () => void;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const accountUser = users.find((u) => u.id === profile.userId);
  const currentPassword =
    credentials.getPassword(profile.userId) ?? DEFAULT_PLATFORM_PASSWORD;

  const [baseline, setBaseline] = useState(() => buildPlanningDraft(profile, enrollment));
  const [draft, setDraft] = useState(() => buildPlanningDraft(profile, enrollment));
  const [personalBaseline, setPersonalBaseline] = useState(() =>
    buildPersonalDataDraft(profile, enrollment, accountUser),
  );
  const [personalDraft, setPersonalDraft] = useState(() =>
    buildPersonalDataDraft(profile, enrollment, accountUser),
  );
  const [personalDataOpen, setPersonalDataOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const savedSupervisorId = profile.supervisorId ?? profile.managerId;
  const planningDirty = useMemo(() => !draftsEqual(draft, baseline), [draft, baseline]);
  const personalDataDirty = useMemo(
    () => !personalDataEqual(personalDraft, personalBaseline) || personalDraft.newPassword.trim().length > 0,
    [personalDraft, personalBaseline],
  );
  const isDirty = planningDirty || personalDataDirty;

  useEffect(() => {
    const next = buildPlanningDraft(profile, enrollment);
    setBaseline(next);
    setDraft(next);
    const user = users.find((u) => u.id === profile.userId);
    const personal = buildPersonalDataDraft(profile, enrollment, user);
    setPersonalBaseline(personal);
    setPersonalDraft(personal);
    setPersonalDataOpen(false);
    setError('');
  }, [profile, enrollment, users]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleCancel = useCallback(() => {
    setDraft(baseline);
    setPersonalDraft(personalBaseline);
    setPersonalDataOpen(false);
    setError('');
    onCancel();
  }, [baseline, personalBaseline, onCancel]);

  const savePersonalData = () => {
    if (!personalDataDirty) return;

    if (!personalDraft.name.trim()) throw new Error('Introduceți numele angajatului.');
    if (!personalDraft.functie.trim()) throw new Error('Introduceți funcția.');
    if (!personalDraft.email.trim()) throw new Error('Introduceți emailul.');

    if (personalDraft.newPassword.trim()) {
      resetUserPassword(profile.userId, personalDraft.newPassword.trim());
    }

    const userPatch: Partial<Pick<User, 'name' | 'email'>> = {};
    if (personalDraft.name.trim() !== personalBaseline.name.trim()) {
      userPatch.name = personalDraft.name.trim();
    }
    if (personalDraft.email.trim() !== personalBaseline.email.trim()) {
      userPatch.email = personalDraft.email.trim();
    }
    if (Object.keys(userPatch).length > 0) {
      updateUser(profile.userId, userPatch);
    }

    const profilePatch: Partial<Pick<EmployeeProfile, 'prenume' | 'nume' | 'functie' | 'departamentId'>> =
      {};
    if (personalDraft.name.trim() !== personalBaseline.name.trim()) {
      const { prenume, nume } = splitName(personalDraft.name);
      profilePatch.prenume = prenume;
      profilePatch.nume = nume;
    }
    if (personalDraft.functie.trim() !== personalBaseline.functie.trim()) {
      profilePatch.functie = personalDraft.functie.trim();
    }
    if (personalDraft.departmentId !== personalBaseline.departmentId) {
      profilePatch.departamentId = personalDraft.departmentId;
    }
    if (Object.keys(profilePatch).length > 0) {
      hrPerformanceStore.updateProfile(profile.userId, profilePatch);
    }

    if (enrollment) {
      const enrollmentPatch: Partial<
        Pick<TrainingEnrollment, 'cohortId' | 'departmentId' | 'programStart'>
      > = {};
      if (personalDraft.cohortId !== personalBaseline.cohortId) {
        enrollmentPatch.cohortId = personalDraft.cohortId;
      }
      if (personalDraft.departmentId !== personalBaseline.departmentId) {
        enrollmentPatch.departmentId = personalDraft.departmentId;
      }
      if (personalDraft.programStart !== personalBaseline.programStart) {
        enrollmentPatch.programStart = personalDraft.programStart;
      }
      if (Object.keys(enrollmentPatch).length > 0) {
        updateEnrollment(enrollment.id, enrollmentPatch);
      }
    }

    if (personalDraft.grantMentor !== personalBaseline.grantMentor) {
      setMentorStatus(profile.userId, personalDraft.grantMentor);
    }
  };

  const handleSave = () => {
    setError('');
    if (planningDirty) {
      if (!enrollment) {
        setError('Nu există înscriere activă — nu se poate salva mentorul principal.');
        return;
      }
      if (!draft.principalMentorId) {
        setError('Selectați mentorul principal.');
        return;
      }
      if (!draft.supervisorId) {
        setError('Selectați supervizorul.');
        return;
      }
    }

    setSaving(true);
    try {
      savePersonalData();
      if (planningDirty && enrollment) {
        if (draft.principalMentorId !== baseline.principalMentorId) {
          assignMentor(enrollment.id, draft.principalMentorId);
        }
        if (draft.supervisorId !== baseline.supervisorId) {
          hrPerformanceStore.setSupervisor(profile.userId, draft.supervisorId, changedBy);
        }
        for (const { weekNumber } of EVALUATION_WEEK_LABELS) {
          if (draft.weeklyMentors[weekNumber] !== baseline.weeklyMentors[weekNumber]) {
            hrPerformanceStore.setWeeklyEvalMentor(
              profile.userId,
              weekNumber,
              draft.weeklyMentors[weekNumber],
              changedBy,
            );
          }
        }
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare.');
    } finally {
      setSaving(false);
    }
  };

  const personalSummary = `${personalBaseline.name} · ${personalBaseline.functie} · ${personalBaseline.email}`;

  const handleArchiveEmployee = () => {
    const ok = window.confirm(
      `Sigur doriți să arhivați angajatul „${personalBaseline.name}”?\n\nNu va mai apărea în listele active și nu se va mai putea autentifica, dar toate datele (instruire, evaluări, documente) rămân salvate.`,
    );
    if (!ok) return;
    setError('');
    setSaving(true);
    try {
      archiveEmployee(profile.userId);
      onArchived();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la arhivare.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-corporate-dark">
          {profile.prenume} {profile.nume}
        </h3>
        <p className="text-sm text-corporate-muted">{profile.functie}</p>
        {accountUser && (
          <p className="text-xs text-corporate-muted mt-0.5">Cont acces: {accountUser.email}</p>
        )}
        {isDirty && (
          <p className="text-xs text-amber-700 mt-1">Modificări nesalvate — salvați sau anulați.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="block text-sm">
          <span className="text-corporate-muted text-xs">Mentor principal</span>
          {enrollment ? (
            <>
              <CurrentAssigneeLabel
                label="Mentor principal"
                userId={enrollment.mentorId}
                users={users}
              />
              <SearchablePersonSelect
                value={draft.principalMentorId}
                options={mentorOptions}
                onChange={(principalMentorId) =>
                  setDraft((prev) => ({ ...prev, principalMentorId }))
                }
                placeholder="Caută mentor după nume…"
                required
                resetKey={profile.userId}
              />
              <AssignmentHistoryList
                entries={profile.assignmentHistory?.principalMentor}
                users={users}
                label="mentor principal"
              />
            </>
          ) : (
            <p className="mt-1 text-xs text-amber-700 italic">Fără înscriere activă</p>
          )}
        </div>

        <div className="block text-sm">
          <span className="text-corporate-muted text-xs">Supervizor</span>
          <CurrentAssigneeLabel label="Supervizor" userId={savedSupervisorId} users={users} />
          <SearchablePersonSelect
            value={draft.supervisorId}
            options={supervisorOptions}
            onChange={(supervisorId) => setDraft((prev) => ({ ...prev, supervisorId }))}
            placeholder="Caută supervizor după nume…"
            allowEmpty
            emptyLabel="— Selectați —"
            resetKey={profile.userId}
          />
          <AssignmentHistoryList
            entries={profile.assignmentHistory?.supervisor}
            users={users}
            label="supervizor"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-corporate-border">
        <p className="text-sm font-medium text-corporate-dark mb-2">Mentori pe săptămână (S1–S4)</p>
        <WeeklyEvalMentorsEditor
          profile={profile}
          compact
          draftMode
          weeklyDraft={draft.weeklyMentors}
          principalMentorId={draft.principalMentorId}
          onWeeklyDraftChange={(weekNumber, mentorId) =>
            setDraft((prev) => ({
              ...prev,
              weeklyMentors: { ...prev.weeklyMentors, [weekNumber]: mentorId },
            }))
          }
        />
      </div>

      {!supabaseAuthActive && (
        <div className="pt-2 border-t border-corporate-border space-y-3">
          <button
            type="button"
            onClick={() => setPersonalDataOpen((open) => !open)}
            className={[
              'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
              personalDataOpen
                ? 'bg-corporate-black text-white shadow-sm'
                : 'border border-corporate-border bg-white text-corporate-dark hover:bg-corporate-surface',
            ].join(' ')}
          >
            <span className="block text-sm font-medium">Modificarea datelor personale</span>
            <span
              className={[
                'block text-xs mt-0.5',
                personalDataOpen ? 'text-white/80' : 'text-corporate-muted',
              ].join(' ')}
            >
              {personalSummary}
            </span>
            <span
              className={[
                'block text-xs mt-0.5 font-mono',
                personalDataOpen ? 'text-white/70' : 'text-corporate-muted/80',
              ].join(' ')}
            >
              Parola actuală: {currentPassword}
            </span>
          </button>

          {personalDataOpen && (
            <div className="rounded-xl border border-corporate-border bg-white p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Nume angajat"
                  value={personalDraft.name}
                  onChange={(e) => setPersonalDraft((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Funcție"
                  value={personalDraft.functie}
                  onChange={(e) => setPersonalDraft((prev) => ({ ...prev, functie: e.target.value }))}
                  required
                />
                <Input
                  label="Email profil"
                  type="email"
                  value={personalDraft.email}
                  onChange={(e) => setPersonalDraft((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
                <div>
                  <Input
                    label="Parolă nouă"
                    type="text"
                    autoComplete="new-password"
                    value={personalDraft.newPassword}
                    onChange={(e) =>
                      setPersonalDraft((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                    placeholder="Lăsați gol pentru a păstra parola actuală"
                  />
                  <p className="text-[10px] text-corporate-muted mt-1">
                    Parola actuală: <span className="font-mono">{currentPassword}</span> — minim 6
                    caractere la schimbare.
                  </p>
                </div>
                {enrollment ? (
                  <>
                    <label className="block text-sm">
                      <span className="text-corporate-muted text-xs">Grupă instruire</span>
                      <select
                        className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                        value={personalDraft.cohortId}
                        onChange={(e) =>
                          setPersonalDraft((prev) => ({ ...prev, cohortId: e.target.value }))
                        }
                      >
                        {COHORTS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="text-corporate-muted text-xs">Departament</span>
                      <select
                        className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                        value={personalDraft.departmentId}
                        onChange={(e) =>
                          setPersonalDraft((prev) => ({
                            ...prev,
                            departmentId: e.target.value as DepartmentId,
                          }))
                        }
                      >
                        {DEPARTMENTS.filter((d) => d.planAvailable).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Input
                      label="Start program"
                      type="date"
                      value={personalDraft.programStart}
                      onChange={(e) =>
                        setPersonalDraft((prev) => ({ ...prev, programStart: e.target.value }))
                      }
                      required
                    />
                  </>
                ) : (
                  <p className="sm:col-span-2 text-xs text-amber-700 italic">
                    Fără înscriere activă — grupă, departament și start program nu pot fi modificate.
                  </p>
                )}
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-corporate-muted">
                <input
                  type="checkbox"
                  checked={personalDraft.grantMentor}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({ ...prev, grantMentor: e.target.checked }))
                  }
                />
                Oferă și statut mentor temporar
              </label>
              <Button
                type="button"
                variant="ghost"
                className="text-xs"
                onClick={() =>
                  setPersonalDraft((prev) => ({ ...prev, newPassword: DEFAULT_PLATFORM_PASSWORD }))
                }
              >
                Folosește parola standard ({DEFAULT_PLATFORM_PASSWORD})
              </Button>
            </div>
          )}
        </div>
      )}

      {supabaseAuthActive && (
        <div className="pt-2 border-t border-corporate-border space-y-3">
          <button
            type="button"
            onClick={() => setPersonalDataOpen((open) => !open)}
            className={[
              'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
              personalDataOpen
                ? 'bg-corporate-black text-white shadow-sm'
                : 'border border-corporate-border bg-white text-corporate-dark hover:bg-corporate-surface',
            ].join(' ')}
          >
            <span className="block text-sm font-medium">Modificarea datelor personale</span>
            <span
              className={[
                'block text-xs mt-0.5',
                personalDataOpen ? 'text-white/80' : 'text-corporate-muted',
              ].join(' ')}
            >
              {personalSummary}
            </span>
          </button>
          {personalDataOpen && (
            <div className="rounded-xl border border-corporate-border bg-white p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Nume angajat"
                  value={personalDraft.name}
                  onChange={(e) => setPersonalDraft((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Funcție"
                  value={personalDraft.functie}
                  onChange={(e) => setPersonalDraft((prev) => ({ ...prev, functie: e.target.value }))}
                  required
                />
                <Input
                  label="Email profil"
                  type="email"
                  value={personalDraft.email}
                  onChange={(e) => setPersonalDraft((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
                {enrollment && (
                  <>
                    <label className="block text-sm">
                      <span className="text-corporate-muted text-xs">Grupă instruire</span>
                      <select
                        className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                        value={personalDraft.cohortId}
                        onChange={(e) =>
                          setPersonalDraft((prev) => ({ ...prev, cohortId: e.target.value }))
                        }
                      >
                        {COHORTS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="text-corporate-muted text-xs">Departament</span>
                      <select
                        className="mt-1 w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
                        value={personalDraft.departmentId}
                        onChange={(e) =>
                          setPersonalDraft((prev) => ({
                            ...prev,
                            departmentId: e.target.value as DepartmentId,
                          }))
                        }
                      >
                        {DEPARTMENTS.filter((d) => d.planAvailable).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Input
                      label="Start program"
                      type="date"
                      value={personalDraft.programStart}
                      onChange={(e) =>
                        setPersonalDraft((prev) => ({ ...prev, programStart: e.target.value }))
                      }
                      required
                    />
                  </>
                )}
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-corporate-muted">
                <input
                  type="checkbox"
                  checked={personalDraft.grantMentor}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({ ...prev, grantMentor: e.target.checked }))
                  }
                />
                Oferă și statut mentor temporar
              </label>
              <p className="text-xs text-corporate-muted">
                Parolele se gestionează în Supabase Auth — resetarea din aplicație nu este disponibilă.
              </p>
            </div>
          )}
        </div>
      )}

      {personalDataOpen && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-900">Arhivare angajat</p>
          <p className="text-xs text-amber-800/90">
            Scoate angajatul din listele active. Progresul, evaluările și documentele rămân în sistem.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="text-amber-900 border border-amber-300 hover:bg-amber-100"
            onClick={handleArchiveEmployee}
            disabled={saving}
          >
            Arhivează angajatul
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-corporate-border">
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={!isDirty || saving || (planningDirty && !enrollment)}
        >
          {saving ? 'Se salvează…' : 'Salvează modificările'}
        </Button>
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={saving}>
          Anulează
        </Button>
      </div>
    </div>
  );
}
