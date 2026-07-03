import { describe, expect, it } from 'vitest';
import {
  canHrConfirm,
  canSupervisorConfirm,
  canSupervisorPlan,
  canTrainerSubmitReport,
  normalizeReTrainingStatus,
} from '@/lib/reTrainingWorkflow';
import type { ReTrainingSession } from '@/types';

const base: ReTrainingSession = {
  id: 'rt-1',
  angajatId: 'u-ang',
  supervisorId: 'u-sup',
  mentorId: 'u-mentor',
  titlu: 'Re-instruire',
  descriere: 'Test',
  errorMotiv: 'neatentie',
  errorCaseIds: [],
  materialUrls: [],
  documentIds: [],
  termenLimita: '2026-04-01',
  status: 'alerta_supervizor',
  createdAt: '2026-01-01',
};

describe('reTrainingWorkflow', () => {
  it('migrează statusul legacy obligatoriu', () => {
    expect(normalizeReTrainingStatus('obligatoriu')).toBe('alerta_supervizor');
  });

  it('permite planificare doar la alertă supervizor', () => {
    expect(canSupervisorPlan({ ...base, status: 'alerta_supervizor' })).toBe(true);
    expect(canSupervisorPlan({ ...base, status: 'planificat' })).toBe(false);
  });

  it('permite raport trainer în planificat sau în curs', () => {
    expect(canTrainerSubmitReport({ ...base, status: 'planificat' })).toBe(true);
    expect(canTrainerSubmitReport({ ...base, status: 'in_curs' })).toBe(true);
    expect(canTrainerSubmitReport({ ...base, status: 'raport_trainer' })).toBe(false);
  });

  it('permite confirmare supervizor după raport', () => {
    expect(canSupervisorConfirm({ ...base, status: 'raport_trainer' })).toBe(true);
    expect(canSupervisorConfirm({ ...base, status: 'in_curs' })).toBe(false);
  });

  it('permite confirmare HR după supervizor', () => {
    expect(canHrConfirm({ ...base, status: 'confirmat_supervizor' })).toBe(true);
    expect(canHrConfirm({ ...base, status: 'raport_trainer' })).toBe(false);
  });
});
