import { useEffect, useState, type RefObject } from 'react';
import { useViewportPreview } from '@/context/ViewportPreviewContext';
import {
  resolveEquipmentLayoutMode,
  type EquipmentLayoutMode,
} from '@/lib/equipmentLayout';

/**
 * Detectează modul de layout pentru modulul echipament (4 breakpoints).
 * Respectă preview-ul ViewportFrame când e activ.
 */
export function useEquipmentLayoutMode(containerRef?: RefObject<HTMLElement | null>): EquipmentLayoutMode {
  const { mode, frameWidth } = useViewportPreview();
  const [modeFromWidth, setModeFromWidth] = useState<EquipmentLayoutMode>(() =>
    typeof window !== 'undefined' ? resolveEquipmentLayoutMode(window.innerWidth) : 'laptop',
  );

  useEffect(() => {
    const el = containerRef?.current;

    const update = () => {
      const width = el?.getBoundingClientRect().width ?? window.innerWidth;
      setModeFromWidth(resolveEquipmentLayoutMode(width));
    };

    update();

    const ro = el ? new ResizeObserver(update) : null;
    if (el && ro) ro.observe(el);

    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef]);

  if (mode === 'mobile') return 'phone';
  if (mode === 'tablet') return 'tablet';
  if (mode === 'laptop') return 'laptop';
  if (mode === 'desktop') return 'desktop';
  if (frameWidth != null) return resolveEquipmentLayoutMode(frameWidth);

  return modeFromWidth;
}
