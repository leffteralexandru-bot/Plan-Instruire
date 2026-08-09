import { describe, expect, it } from 'vitest';
import { manualPageImageSources, manualPageSmUrl } from './manualPageSrc';

describe('manualPageSrc', () => {
  it('derivă URL -sm din page-NN.png', () => {
    expect(manualPageSmUrl('/docs/equipment/proliner/pages/page-01.png')).toBe(
      '/docs/equipment/proliner/pages/page-01-sm.png',
    );
    expect(manualPageSmUrl('/docs/foo.pdf')).toBeNull();
  });

  it('pune srcSet pentru pagini de manual', () => {
    const s = manualPageImageSources('/docs/x/pages/page-03.png');
    expect(s.src).toBe('/docs/x/pages/page-03.png');
    expect(s.srcSet).toContain('page-03-sm.png 1400w');
    expect(s.srcSet).toContain('page-03.png 2800w');
    expect(s.sizes).toBeTruthy();
  });
});
