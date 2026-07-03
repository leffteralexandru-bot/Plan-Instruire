import { describe, expect, it } from 'vitest';
import {
  getExpectedCompletedDays,
  getTraineeStatus,
  getTraineeStatusLabel,
  PROGRAM_CALENDAR_DAYS,
} from '@/lib/hrAnalytics';
import type { TraineeHrReport } from '@/lib/hrReport';

function row(overrides: Partial<TraineeHrReport> = {}): TraineeHrReport {
  return {
    userId: 'u-stagiar-1',
    name: 'Alexandru Popescu',
    email: 'a.popescu@artgranit.ro',
    programStart: '2026-06-01',
    completedDays: 0,
    totalDays: 20,
    progressPercent: 0,
    pendingMentorValidations: [],
    quizPassed: null,
    quizScoreLabel: null,
    quizAttempts: null,
    certificateIssued: false,
    certificateDate: null,
    acteConstatareCount: 0,
    photosCount: 0,
    competencyScores: {},
    lastActivityAt: null,
    ...overrides,
  };
}

describe('hrAnalytics', () => {
  it('program artGRANIT durează 28 zile calendar', () => {
    expect(PROGRAM_CALENDAR_DAYS).toBe(28);
  });

  it('status completed când certificat emis', () => {
    const ref = new Date('2026-07-15');
    expect(getTraineeStatus(row({ certificateIssued: true, completedDays: 18 }), ref)).toBe('completed');
  });

  it('status not_started fără activitate', () => {
    expect(getTraineeStatus(row())).toBe('not_started');
  });

  it('status behind când validări mentor în așteptare', () => {
    expect(getTraineeStatus(row({ completedDays: 5, pendingMentorValidations: [5], lastActivityAt: '2026-06-05' }))).toBe(
      'behind',
    );
  });

  it('getExpectedCompletedDays proporțional', () => {
    const start = '2026-06-01';
    const mid = new Date('2026-06-15'); // ~14 days
    const expected = getExpectedCompletedDays(start, mid);
    expect(expected).toBeGreaterThan(0);
    expect(expected).toBeLessThanOrEqual(20);
  });

  it('etichete status în română', () => {
    expect(getTraineeStatusLabel('on_track')).toBe('La zi');
    expect(getTraineeStatusLabel('completed')).toBe('Finalizat');
  });
});

describe('dataBackup', () => {
  it('respinge backup non-artGRANIT', async () => {
    const { validateBackup } = await import('@/lib/dataBackup');
    expect(validateBackup({ organization: 'OtherCo' })).toBeNull();
    expect(validateBackup(null)).toBeNull();
  });

  it('acceptă backup artGRANIT valid', async () => {
    const { validateBackup } = await import('@/lib/dataBackup');
    const backup = validateBackup({
      backupVersion: 1,
      exportedAt: '2026-06-01',
      organization: 'artGRANIT',
      settings: { programVersion: '2026.1' },
      progress: {},
    });
    expect(backup?.organization).toBe('artGRANIT');
  });
});
