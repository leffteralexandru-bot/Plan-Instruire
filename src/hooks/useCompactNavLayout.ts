import { useEffect, useState } from 'react';
import { useViewportPreview } from '@/context/ViewportPreviewContext';
import { BREAKPOINTS } from '@/lib/responsiveLayout';

/** Sub laptop (1024px): navigare jos ca pe telefon — mobil + tabletă. */
const COMPACT_NAV_MQ = `(max-width: ${BREAKPOINTS.laptop - 1}px)`;

export function useCompactNavLayout(): boolean {
  const { mode, frameWidth, isRealMobile } = useViewportPreview();
  const [viewportCompact, setViewportCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(COMPACT_NAV_MQ).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_NAV_MQ);
    const onChange = () => setViewportCompact(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (isRealMobile) return true;
  if (mode === 'mobile' || mode === 'tablet') return true;
  if (mode === 'laptop' || mode === 'desktop') return false;
  if (frameWidth != null) return frameWidth < BREAKPOINTS.laptop;
  return viewportCompact;
}
