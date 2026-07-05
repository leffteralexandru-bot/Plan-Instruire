import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSubmitCerereBlockReason, pedagogicReTrainingStore } from '@/lib/pedagogicReTraining';

const ls: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(ls)) delete ls[k];
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => ls[k] ?? null,
    setItem: (k: string, v: string) => {
      ls[k] = v;
    },
    removeItem: (k: string) => {
      delete ls[k];
    },
    clear: () => {
      for (const k of Object.keys(ls)) delete ls[k];
    },
  });
  ls.artgranit_employee_profiles = JSON.stringify([
    {
      userId: 'u-ang',
      prenume: 'Ion',
      nume: 'Popescu',
      functie: 'Inginer',
      departamentId: 'ingineri',
      dataAngajarii: '2026-01-01',
      supervisorId: 'u-sup',
      managerId: 'u-sup',
      status: 'activ',
      tipAngajat: 'experimentat',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ]);
  ls.artgranit_users = JSON.stringify([
    { id: 'u-ang', name: 'Ion Popescu', roles: ['angajat'], email: 'a@test.ro', active: true, createdAt: '2026-01-01' },
    { id: 'u-sup', name: 'Supervizor', roles: ['supervisor'], email: 's@test.ro', active: true, createdAt: '2026-01-01' },
    { id: 'u-mentor', name: 'Mentor', roles: ['mentor'], email: 'm@test.ro', active: true, createdAt: '2026-01-01' },
  ]);
  ls.artgranit_enrollments = JSON.stringify([
    {
      id: 'enr-1',
      angajatId: 'u-ang',
      mentorId: 'u-mentor',
      cohortId: 'c1',
      departmentId: 'ingineri',
      status: 'active',
      startDate: '2026-01-01',
    },
  ]);
  ls.artgranit_re_training_sessions = JSON.stringify([]);
  ls.artgranit_reinstruire_cereri = JSON.stringify([]);
});

describe('pedagogicReTraining', () => {
  it('blochează cererea fără supervizor', () => {
    ls.artgranit_employee_profiles = JSON.stringify([
      {
        userId: 'u-ang',
        prenume: 'Ion',
        nume: 'Popescu',
        functie: 'Inginer',
        departamentId: 'ingineri',
        dataAngajarii: '2026-01-01',
        status: 'activ',
        tipAngajat: 'experimentat',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);
    ls.artgranit_enrollments = JSON.stringify([]);
    const reason = getSubmitCerereBlockReason({ angajatId: 'u-ang', topicDayId: 'day-1' });
    expect(reason).toMatch(/supervizor/i);
  });

  it('trimite cerere și o acceptă supervizorul', () => {
    const submit = pedagogicReTrainingStore.submitCerere({
      angajatId: 'u-ang',
      topicDayId: 'day-1',
      motiv: 'neintelegere',
      mesaj: 'Nu am înțeles procedura',
    });
    expect('error' in submit).toBe(false);
    if ('error' in submit) return;

    const pending = pedagogicReTrainingStore.getCereri({ supervisorId: 'u-sup', status: 'trimisa' });
    expect(pending).toHaveLength(1);

    const accept = pedagogicReTrainingStore.acceptCerere({
      cerereId: submit.cerere.id,
      supervisorId: 'u-sup',
    });
    expect('error' in accept).toBe(false);
    if ('error' in accept) return;

    expect(accept.session.trigger).toBe('cerere_angajat');
    expect(accept.session.status).toBe('planificat');
    expect(accept.session.trainerId).toBe('u-mentor');
    expect(accept.cerere.status).toBe('acceptata');
  });

  it('blochează a doua cerere pentru aceeași lecție', () => {
    pedagogicReTrainingStore.submitCerere({
      angajatId: 'u-ang',
      topicDayId: 'day-2',
      motiv: 'uitare',
    });
    const second = pedagogicReTrainingStore.submitCerere({
      angajatId: 'u-ang',
      topicDayId: 'day-2',
      motiv: 'eroare',
    });
    expect('error' in second).toBe(true);
  });
});
