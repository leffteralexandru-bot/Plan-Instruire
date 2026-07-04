import { describe, expect, it } from 'vitest';
import { buildCertificateMetrics, ratingLabelFromScore } from '@/lib/certificateMetrics';
import type { AppProgress } from '@/types';

describe('certificateMetrics', () => {
  it('calculează nivelul din feedback S2/S4 și media testului', () => {
    const progress: AppProgress = {
      userId: 'u-1',
      schemaVersion: 2,
      days: {
        'day-10': {
          completedTasks: [],
          mentorValidated: true,
          quizResult: {
            score: 8,
            total: 10,
            passed: true,
            completedAt: '2026-03-01T10:00:00.000Z',
            attempts: 1,
          },
        },
      },
      feedbacks: [
        {
          weekNumber: 2,
          autonomieProliner: 4,
          proiectareFaraErori: 3,
          integrareEchipa: 4,
          comentarii: '',
        },
        {
          weekNumber: 4,
          autonomieProliner: 5,
          proiectareFaraErori: 4,
          integrareEchipa: 5,
          comentarii: '',
        },
      ],
      acteConstatare: [],
      photos: [],
      auditLog: [],
    };

    const metrics = buildCertificateMetrics(progress);
    expect(metrics.nivelScore).toBe(4.2);
    expect(metrics.nivelLabel).toBe(ratingLabelFromScore(4.2));
    expect(metrics.testScoreLabel).toBe('8/10');
    expect(metrics.testPercent).toBe(80);
    expect(metrics.testPassed).toBe(true);
  });
});
