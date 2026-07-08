import { useEffect, useState } from 'react';
import { useViewportPreview } from '@/context/ViewportPreviewContext';
import { BREAKPOINTS } from '@/lib/responsiveLayout';

/** Doar telefon (<768px) — nu tabletă / laptop. */
const PHONE_MQ = `(max-width: ${BREAKPOINTS.tablet - 1}px)`;

export function usePhoneLayout(): boolean {
  const { mode, frameWidth, isRealMobile } = useViewportPreview();
  const [viewportPhone, setViewportPhone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(PHONE_MQ).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(PHONE_MQ);
    const onChange = () => setViewportPhone(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (isRealMobile) return true;
  if (mode === 'mobile') return true;
  if (mode === 'tablet' || mode === 'laptop' || mode === 'desktop') return false;
  if (frameWidth != null) return frameWidth < BREAKPOINTS.tablet;
  return viewportPhone;
}
