import { describe, expect, it } from 'vitest';
import {
  buildErrorReTrainingGroups,
  isActiveReTrainingPipelineError,
  isHistoryOnlyError,
} from '@/lib/errorReTrainingDisplay';
import type { ErrorCase } from '@/types';

function err(partial: Partial<ErrorCase> & Pick<ErrorCase, 'id' | 'angajatId'>): ErrorCase {
  return {
    raportatDe: 'sup',
    raportatDeNume: 'Sup',
    data: '2026-07-01',
    motiv: 'neatentie',
    descriere: 'x',
    planActiune: { pasi: 'p', responsabilId: 'sup', termenLimita: '2026-08-01', status: 'deschis' },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  };
}

describe('errorReTrainingDisplay', () => {
  it('grupează erori trimise_hr pe aceeași temă', () => {
    const cases = [
      err({
        id: 'e1',
        angajatId: 'a1',
        hrStatus: 'trimis_hr',
        reTrainingProposal: {
          topicDayId: 'day-3',
          topicTitle: 'Ziua 3',
          trainerId: 'm1',
          lessonNotes: '',
          lessonDocumentIds: [],
          plannedStartDate: '2026-07-05',
          submittedAt: '2026-07-01',
        },
      }),
      err({
        id: 'e2',
        angajatId: 'a1',
        hrStatus: 'trimis_hr',
        reTrainingProposal: {
          topicDayId: 'day-3',
          topicTitle: 'Ziua 3',
          trainerId: 'm1',
          lessonNotes: '',
          lessonDocumentIds: [],
          plannedStartDate: '2026-07-05',
          submittedAt: '2026-07-02',
        },
      }),
    ];
    const groups = buildErrorReTrainingGroups(cases);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.errors).toHaveLength(2);
    expect(groups[0]!.pendingHr).toBe(true);
  });

  it('exclude din istoric erorile în flux activ', () => {
    const active = err({ id: 'e1', angajatId: 'a1', hrStatus: 'trimis_hr' });
    const archived = err({ id: 'e2', angajatId: 'a1', hrStatus: 'respins_hr' });
    expect(isActiveReTrainingPipelineError(active)).toBe(true);
    expect(isHistoryOnlyError(active)).toBe(false);
    expect(isHistoryOnlyError(archived)).toBe(true);
  });
});
