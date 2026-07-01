import { describe, expect, it } from 'vitest';
import { migrateLegacyProgressIds } from '@/lib/migrateLegacy';
import type { AppProgress } from '@/types';

function emptyProgress(userId: string): AppProgress {
  return {
    userId,
    days: { 'day-1': { completedTasks: ['d1-t1'], mentorValidated: false } },
    feedbacks: [],
    acteConstatare: [],
    photos: [],
    auditLog: [{ id: 'a1', action: 'test', actorId: 'x', actorName: 'X', createdAt: '2026-01-01' }],
    schemaVersion: 2,
  };
}

describe('migrateLegacyProgressIds', () => {
  it('mută u-stagiar → u-stagiar-1', () => {
    let store: Record<string, AppProgress> = {
      'u-stagiar': emptyProgress('u-stagiar'),
    };
    const moved = migrateLegacyProgressIds(
      () => store,
      (map) => {
        store = map;
      },
    );
    expect(moved).toBe(1);
    expect(store['u-stagiar']).toBeUndefined();
    expect(store['u-stagiar-1']?.userId).toBe('u-stagiar-1');
  });
});
