import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_DEVICE_PREVIEW,
  type DevicePreview,
  type LayoutMode,
  resolveLayoutMode,
  viewportLayoutMode,
} from '@/lib/devicePreview';

interface DevicePreviewContextValue {
  preview: DevicePreview;
  layoutMode: LayoutMode;
  isSimulated: boolean;
  isAuto: boolean;
  setPreview: (value: DevicePreview) => void;
  resetToAuto: () => void;
  isMobileLayout: boolean;
  isTabletLayout: boolean;
  isDesktopLayout: boolean;
}

const DevicePreviewContext = createContext<DevicePreviewContextValue | null>(null);

export function DevicePreviewProvider({ children }: { children: ReactNode }) {
  const [preview, setPreviewState] = useState<DevicePreview>(DEFAULT_DEVICE_PREVIEW);
  const [viewportMode, setViewportMode] = useState<LayoutMode>(() => viewportLayoutMode());

  useEffect(() => {
    const onChange = () => setViewportMode(viewportLayoutMode());
    const mqMobile = window.matchMedia('(max-width: 767px)');
    const mqTablet = window.matchMedia('(max-width: 1023px)');
    mqMobile.addEventListener('change', onChange);
    mqTablet.addEventListener('change', onChange);
    onChange();
    return () => {
      mqMobile.removeEventListener('change', onChange);
      mqTablet.removeEventListener('change', onChange);
    };
  }, []);

  /** Pe telefon fizic — mereu auto, fără override manual */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const enforceAuto = () => {
      if (mq.matches) setPreviewState(DEFAULT_DEVICE_PREVIEW);
    };
    enforceAuto();
    mq.addEventListener('change', enforceAuto);
    return () => mq.removeEventListener('change', enforceAuto);
  }, []);

  const setPreview = useCallback((value: DevicePreview) => {
    setPreviewState(value);
  }, []);

  const resetToAuto = useCallback(() => {
    setPreviewState(DEFAULT_DEVICE_PREVIEW);
  }, []);

  const layoutMode = preview === 'auto' ? viewportMode : resolveLayoutMode(preview);
  const isAuto = preview === 'auto';
  const isSimulated = !isAuto;

  const value = useMemo(
    () => ({
      preview,
      layoutMode,
      isSimulated,
      isAuto,
      setPreview,
      resetToAuto,
      isMobileLayout: layoutMode === 'mobile',
      isTabletLayout: layoutMode === 'tablet',
      isDesktopLayout: layoutMode === 'desktop',
    }),
    [preview, layoutMode, isSimulated, isAuto, setPreview, resetToAuto],
  );

  return (
    <DevicePreviewContext.Provider value={value}>{children}</DevicePreviewContext.Provider>
  );
}

export function useDevicePreview() {
  const ctx = useContext(DevicePreviewContext);
  if (!ctx) throw new Error('useDevicePreview must be used within DevicePreviewProvider');
  return ctx;
}
