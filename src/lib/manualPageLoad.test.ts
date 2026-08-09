import { describe, expect, it } from 'vitest';
import { shouldPrioritizeManualPage } from './manualPageLoad';

describe('shouldPrioritizeManualPage', () => {
  it('prioritizează prima pagină când nu există ?page=', () => {
    expect(shouldPrioritizeManualPage('p1', 0, null)).toBe(true);
    expect(shouldPrioritizeManualPage('p2', 1, null)).toBe(false);
  });

  it('prioritizează pagina din deep-link, nu prima', () => {
    expect(shouldPrioritizeManualPage('p1', 0, 'p5')).toBe(false);
    expect(shouldPrioritizeManualPage('p5', 4, 'p5')).toBe(true);
  });
});
