import { describe, expect, it, beforeEach, vi } from 'vitest';
import { resetAllErrorWorkflowData, countPendingErrorWorkflowItems } from '@/lib/resetErrorWorkflow';

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
});

describe('resetAllErrorWorkflowData', () => {
  it('șterge erori, sesiuni și documente legate', () => {
    ls.artgranit_users = JSON.stringify([
      { id: 'u-ang', name: 'Angajat', roles: ['angajat'], email: 'a@t.ro', active: true, createdAt: '2026-01-01' },
    ]);
    ls.artgranit_employee_profiles = JSON.stringify([
      {
        userId: 'u-ang',
        prenume: 'A',
        nume: 'B',
        functie: 'Ing',
        departamentId: 'ingineri',
        dataAngajarii: '2026-01-01',
        status: 'in_reinstruire',
        tipAngajat: 'experimentat',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);
    ls.artgranit_error_cases = JSON.stringify([
      {
        id: 'err-1',
        angajatId: 'u-ang',
        raportatDe: 'u-sup',
        raportatDeNume: 'Sup',
        data: '2026-07-01',
        motiv: 'neatentie',
        descriere: 'x',
        planActiune: { pasi: 'p', responsabilId: 'u-sup', termenLimita: '2026-08-01', status: 'deschis' },
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);
    ls.artgranit_re_training_sessions = JSON.stringify([
      {
        id: 'rt-1',
        angajatId: 'u-ang',
        supervisorId: 'u-sup',
        mentorId: 'u-m',
        titlu: 'Re',
        descriere: 'd',
        errorMotiv: 'neatentie',
        errorCaseIds: ['err-1'],
        materialUrls: [],
        documentIds: [],
        status: 'in_curs',
        termenLimita: '2026-08-01',
        createdAt: '2026-01-01',
      },
    ]);
    ls.artgranit_hr_documents = JSON.stringify([
      { id: 'doc-1', tip: 'nota_constatare', errorCaseId: 'err-1', nume: 'nota.pdf', mimeType: 'application/pdf', sizeBytes: 1, uploadedBy: 'u', uploadedByNume: 'U', createdAt: '2026-01-01' },
      { id: 'doc-2', tip: 'altul', nume: 'keep.pdf', mimeType: 'application/pdf', sizeBytes: 1, uploadedBy: 'u', uploadedByNume: 'U', createdAt: '2026-01-01' },
    ]);

    const result = resetAllErrorWorkflowData();
    expect(result.removedErrors).toBe(1);
    expect(result.removedSessions).toBe(1);
    expect(result.removedDocuments).toBe(1);
    expect(result.profilesReactivated).toBe(1);

    const counts = countPendingErrorWorkflowItems();
    expect(counts.errors).toBe(0);
    expect(counts.reTrainingSessions).toBe(0);

    const profile = JSON.parse(ls.artgranit_employee_profiles)[0];
    expect(profile.status).toBe('activ');
  });
});
