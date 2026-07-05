import { useEffect, useState } from 'react';
import { DeviceOutlineIcon } from '@/components/layout/DeviceOutlineIcon';
import { useDevicePreview } from '@/context/DevicePreviewContext';
import { DEFAULT_DEVICE_PREVIEW, DEVICE_PREVIEW_LABELS, layoutModeLabel, type DevicePreview } from '@/lib/devicePreview';

const DEVICES: Exclude<DevicePreview, 'auto'>[] = ['phone', 'tablet', 'laptop'];

/**
 * Override opțional layout — implicit e mod Auto (adaptare la ecran).
 * Vizibil doar pe desktop/tabletă reală (≥768px).
 */
export function DevicePreviewToggle() {
  const { preview, layoutMode, isAuto, setPreview, resetToAuto } = useDevicePreview();
  const [showOnLargeScreen, setShowOnLargeScreen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setShowOnLargeScreen(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (!showOnLargeScreen) return null;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={resetToAuto}
        title="Adaptare automată la mărimea ecranului"
        aria-label="Adaptare automată la mărimea ecranului"
        aria-pressed={isAuto}
        className={[
          'rounded-lg px-2 py-1 text-[9px] font-semibold uppercase tracking-wide transition-colors min-h-[44px]',
          isAuto
            ? 'bg-corporate-gold/25 text-corporate-gold'
            : 'text-white/40 hover:text-white/70 hover:bg-white/5',
        ].join(' ')}
      >
        Auto
      </button>

      <div
        className="flex items-center gap-0.5 rounded-xl border border-white/15 bg-black/30 p-0.5"
        role="group"
        aria-label={`Previzualizare manuală — acum: ${isAuto ? 'automat (' + layoutModeLabel(layoutMode) + ')' : preview}`}
      >
        {DEVICES.map((device) => {
          const active = preview === device;
          return (
            <button
              key={device}
              type="button"
              title={DEVICE_PREVIEW_LABELS[device]}
              aria-label={DEVICE_PREVIEW_LABELS[device]}
              aria-pressed={active}
              onClick={() => setPreview(active ? DEFAULT_DEVICE_PREVIEW : device)}
              className={[
                'touch-target rounded-lg px-2 py-1.5 transition-colors',
                'hover:bg-white/10 hover:text-corporate-gold',
                active ? 'bg-corporate-gold/20 text-corporate-gold' : 'text-white/55',
              ].join(' ')}
            >
              <DeviceOutlineIcon kind={device} className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
