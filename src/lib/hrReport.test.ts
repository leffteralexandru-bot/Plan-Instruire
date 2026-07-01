import { describe, expect, it } from 'vitest';
import {
  buildHrAggregateReport,
  buildTraineeHrReport,
  countCompletedDays,
  getPendingMentorValidations,
  MENTOR_VALIDATION_DAY_NUMBERS,
} from '@/lib/hrReport';
import type { AppProgress, TraineeProfile } from '@/types';

const trainee: TraineeProfile = {
  id: 'u-stagiar-1',
  name: 'Alexandru Popescu',
  roles: ['angajat'],
  email: 'a.popescu@artgranit.ro',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  enrollmentId: 'enr-1',
  mentorId: 'u-mentor',
  cohortId: 'cohort-2026-i',
  departmentId: 'ingineri',
  programStart: '2026-06-01',
  enrollmentStatus: 'active',
};

function baseProgress(overrides: Partial<AppProgress> = {}): AppProgress {
  return {
    userId: trainee.id,
    days: {},
    feedbacks: [],
    acteConstatare: [],
    photos: [],
    auditLog: [],
    schemaVersion: 2,
    ...overrides,
  };
}

describe('MENTOR_VALIDATION_DAY_NUMBERS', () => {
  it('corespunde planului artGRANIT (zile 5, 10, 13, 19, 20)', () => {
    expect(MENTOR_VALIDATION_DAY_NUMBERS).toEqual([5, 10, 13, 19, 20]);
  });
});

describe('countCompletedDays', () => {
  it('0 fără progres', () => {
    expect(countCompletedDays(baseProgress())).toBe(0);
  });

  it('numără zi completă (task-uri + mentor)', () => {
    const p = baseProgress({
      days: {
        'day-1': {
          completedTasks: ['d1-t1', 'd1-t2', 'd1-t3', 'd1-t4'],
          mentorValidated: false,
        },
      },
    });
    expect(countCompletedDays(p)).toBe(1);
  });
});

describe('getPendingMentorValidations', () => {
  it('detectează ziua 5 completă dar nevalidată de mentor', () => {
    const p = baseProgress({
      days: {
        'day-5': {
          completedTasks: ['d5-t1', 'd5-t2', 'd5-t3', 'd5-t4'],
          mentorValidated: false,
        },
      },
    });
    expect(getPendingMentorValidations(p)).toContain(5);
  });
});

describe('buildTraineeHrReport', () => {
  it('include date stagiar artGRANIT', () => {
    const report = buildTraineeHrReport(trainee, baseProgress());
    expect(report.name).toBe('Alexandru Popescu');
    expect(report.email).toBe('a.popescu@artgranit.ro');
    expect(report.programStart).toBe('2026-06-01');
    expect(report.totalDays).toBe(20);
  });

  it('reflectă certificat emis', () => {
    const report = buildTraineeHrReport(
      trainee,
      baseProgress({
        certificate: {
          issuedAt: '2026-07-01T10:00:00.000Z',
          mentorName: 'Ing. Maria Ionescu',
          stagiarName: 'Alexandru Popescu',
          programVersion: '2026.1',
        },
      }),
    );
    expect(report.certificateIssued).toBe(true);
    expect(report.certificateDate).toBe('2026-07-01T10:00:00.000Z');
  });
});

describe('buildHrAggregateReport', () => {
  it('agregă toți stagiarii', () => {
    const report = buildHrAggregateReport([trainee], () => baseProgress(), '2026.1');
    expect(report.organization).toBe('artGRANIT');
    expect(report.programVersion).toBe('2026.1');
    expect(report.summary.totalTrainees).toBe(1);
  });
});

describe('buildHrCsv', () => {
  it('generează CSV cu antet românesc', async () => {
    const { buildHrCsv } = await import('@/lib/exportReport');
    const report = buildHrAggregateReport([trainee], () => baseProgress(), '2026.1');
    const csv = buildHrCsv(report);
    expect(csv).toContain('Stagiar');
    expect(csv).toContain('Alexandru Popescu');
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });
});
