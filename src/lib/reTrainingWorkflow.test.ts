import { describe, expect, it } from 'vitest';
import {
  canHrApprovePlan,
  canMentorViewAssignedSession,
  canSupervisorConfirm,
  canSupervisorPlan,
  canTrainerSubmitReport,
  errorCasesHaveSignedNota,
  isHrApprovedErrorSession,
  isReTrainingVisibleToTrainee,
  normalizeReTrainingStatus,
} from '@/lib/reTrainingWorkflow';
import type { ErrorCase, ReTrainingSession } from '@/types';

const base: ReTrainingSession = {
  id: 'rt-1',
  angajatId: 'u-ang',
  supervisorId: 'u-sup',
  mentorId: 'u-mentor',
  trainerId: 'u-mentor',
  titlu: 'Re-instruire',
  descriere: 'Test',
  errorMotiv: 'neatentie',
  errorCaseIds: ['e1'],
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
    expect(canSupervisorPlan({ ...base, status: 'asteapta_hr' })).toBe(false);
  });

  it('permite aprobare HR doar la asteapta_hr', () => {
    expect(canHrApprovePlan({ ...base, status: 'asteapta_hr' })).toBe(true);
    expect(canHrApprovePlan({ ...base, status: 'planificat' })).toBe(false);
  });

  it('flux HR eroare: mentor confirmă doar după finalizare angajat', () => {
    const hrSession = {
      ...base,
      status: 'in_curs' as const,
      hrPlanApprovedAt: '2026-01-02',
    };
    expect(isHrApprovedErrorSession(hrSession)).toBe(true);
    expect(canTrainerSubmitReport({ ...hrSession, traineeCompletedAt: undefined })).toBe(false);
    expect(canTrainerSubmitReport({ ...hrSession, traineeCompletedAt: '2026-01-03' })).toBe(true);
  });

  it('flux legacy: raport trainer în planificat/in_curs', () => {
    expect(canTrainerSubmitReport({ ...base, status: 'planificat' })).toBe(true);
    expect(canTrainerSubmitReport({ ...base, status: 'in_curs' })).toBe(true);
    expect(canTrainerSubmitReport({ ...base, status: 'asteapta_hr' })).toBe(false);
  });

  it('mentor vede sesiunea atribuită după OK HR', () => {
    expect(canMentorViewAssignedSession({ ...base, status: 'in_curs' }, 'u-mentor')).toBe(true);
    expect(canMentorViewAssignedSession({ ...base, status: 'in_curs' }, 'u-alt')).toBe(false);
  });

  it('vizibil angajat după aprobare HR', () => {
    expect(isReTrainingVisibleToTrainee({ ...base, status: 'in_curs' })).toBe(true);
    expect(isReTrainingVisibleToTrainee({ ...base, status: 'asteapta_hr' })).toBe(false);
  });

  it('permite confirmare supervizor după raport', () => {
    expect(canSupervisorConfirm({ ...base, status: 'raport_trainer' })).toBe(true);
    expect(canSupervisorConfirm({ ...base, status: 'in_curs' })).toBe(false);
  });

  it('verifică notele semnate pe erori', () => {
    const signed: ErrorCase = {
      id: 'e1',
      angajatId: 'u',
      raportatDe: 's',
      raportatDeNume: 'S',
      data: '2026-01-01',
      motiv: 'neatentie',
      descriere: 'x',
      signedDocumentId: 'doc-1',
      planActiune: { pasi: 'p', responsabilId: 's', termenLimita: '2026-02-01', status: 'deschis' },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    const unsigned = { ...signed, signedDocumentId: undefined };
    expect(errorCasesHaveSignedNota([signed])).toBe(true);
    expect(errorCasesHaveSignedNota([unsigned])).toBe(false);
  });
});
