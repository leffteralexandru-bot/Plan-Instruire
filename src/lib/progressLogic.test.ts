import { describe, it, expect } from 'vitest';
import type { DayPlan, DayProgress } from '@/types';
import { isDayComplete, isDayUnlocked, getResumeDayId } from '@/lib/progressLogic';

const day1: DayPlan = {
  id: 'day-1',
  dayNumber: 1,
  title: 'D1',
  tasks: [{ id: 't1', label: 'A' }, { id: 't2', label: 'B' }],
  materials: [],
  requiresMentorValidation: false,
};

const day2: DayPlan = {
  id: 'day-2',
  dayNumber: 2,
  title: 'D2',
  tasks: [{ id: 't3', label: 'C' }],
  materials: [],
  requiresMentorValidation: true,
  mentorValidationLabel: 'Validare',
};

const allDays = [day1, day2];

function prog(overrides: Partial<DayProgress> = {}): DayProgress {
  return { completedTasks: [], mentorValidated: false, ...overrides };
}

describe('isDayComplete', () => {
  it('necesită toate task-urile', () => {
    expect(isDayComplete(day1, prog({ completedTasks: ['t1'] }))).toBe(false);
    expect(isDayComplete(day1, prog({ completedTasks: ['t1', 't2'] }))).toBe(true);
  });

  it('necesită validare mentor când e cazul', () => {
    const done = prog({ completedTasks: ['t3'], mentorValidated: false });
    expect(isDayComplete(day2, done)).toBe(false);
    expect(isDayComplete(day2, { ...done, mentorValidated: true })).toBe(true);
  });
});

describe('isDayUnlocked', () => {
  const getDayProgress = (id: string) =>
    id === 'day-1'
      ? prog({ completedTasks: ['t1', 't2'] })
      : prog();

  const isComplete = (id: string) =>
    id === 'day-1' ? true : false;

  it('ziua 1 e mereu deblocată', () => {
    expect(isDayUnlocked('day-1', allDays, getDayProgress, isComplete)).toBe(true);
  });

  it('ziua 2 blocată dacă ziua 1 incompletă', () => {
    const incomplete = (_id: string) => false;
    expect(isDayUnlocked('day-2', allDays, getDayProgress, incomplete)).toBe(false);
  });

  it('mentorUnlocked override', () => {
    const locked = (_id: string) => false;
    const unlockedProg = () => prog({ mentorUnlocked: true });
    expect(isDayUnlocked('day-2', allDays, unlockedProg, locked)).toBe(true);
  });
});

describe('getResumeDayId', () => {
  it('revine la lastVisited dacă incompletă', () => {
    const id = getResumeDayId(
      allDays,
      'day-1',
      () => true,
      () => false,
    );
    expect(id).toBe('day-1');
  });

  it('găsește prima zi incompletă deblocată', () => {
    const id = getResumeDayId(
      allDays,
      undefined,
      () => true,
      (d) => d === 'day-1',
    );
    expect(id).toBe('day-2');
  });
});
