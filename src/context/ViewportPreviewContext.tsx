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
  VIEWPORT_PREVIEW_WIDTHS,
  type ViewportPreviewMode,
} from '@/lib/responsiveLayout';

const STORAGE_KEY = 'artgranit-viewport-preview';

interface ViewportPreviewContextValue {
  mode: ViewportPreviewMode;
  setMode: (mode: ViewportPreviewMode) => void;
  frameWidth: number | null;
  isSimulated: boolean;
  /** Telefon fizic (iPhone / Android phone) — nu fereastră îngustă pe PC */
  isRealMobile: boolean;
  phoneLayoutLocked: boolean;
}

const ViewportPreviewContext = createContext<ViewportPreviewContextValue | null>(null);

function readStoredMode(): ViewportPreviewMode {
  if (typeof window === 'undefined') return 'auto';
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'mobile' || raw === 'tablet' || raw === 'laptop' || raw === 'desktop' || raw === 'auto') {
    return raw;
  }
  return 'auto';
}

/** Doar dispozitiv mobil real — NU panoul îngust din Cursor / browser pe PC */
function readRealPhoneDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPod/i.test(ua)) return true;
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) return true;
  if (/webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  return false;
}

export function ViewportPreviewProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewportPreviewMode>(readStoredMode);
  const [isRealMobile] = useState(readRealPhoneDevice);

  const setMode = useCallback(
    (next: ViewportPreviewMode) => {
      // Pe telefon fizic: doar Auto + Mobil
      if (isRealMobile && next !== 'auto' && next !== 'mobile') {
        setModeState('auto');
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      setModeState(next);
      if (next === 'auto') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
      }
    },
    [isRealMobile],
  );

  useEffect(() => {
    if (isRealMobile && mode !== 'auto' && mode !== 'mobile') {
      setModeState('auto');
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isRealMobile, mode]);

  useEffect(() => {
    document.documentElement.dataset.viewportPreview = mode;
    return () => {
      delete document.documentElement.dataset.viewportPreview;
    };
  }, [mode]);

  const phoneLayoutLocked = isRealMobile;
  const frameWidth =
    phoneLayoutLocked || mode === 'auto' ? null : VIEWPORT_PREVIEW_WIDTHS[mode];
  const isSimulated = !phoneLayoutLocked && mode !== 'auto';

  const value = useMemo(
    () => ({ mode, setMode, frameWidth, isSimulated, isRealMobile, phoneLayoutLocked }),
    [mode, setMode, frameWidth, isSimulated, isRealMobile, phoneLayoutLocked],
  );

  return (
    <ViewportPreviewContext.Provider value={value}>
      {children}
    </ViewportPreviewContext.Provider>
  );
}

export function useViewportPreview() {
  const ctx = useContext(ViewportPreviewContext);
  if (!ctx) {
    throw new Error('useViewportPreview must be used within ViewportPreviewProvider');
  }
  return ctx;
}
