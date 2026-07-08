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
const PHONE_QUERY = '(max-width: 767px)';

interface ViewportPreviewContextValue {
  mode: ViewportPreviewMode;
  setMode: (mode: ViewportPreviewMode) => void;
  frameWidth: number | null;
  isSimulated: boolean;
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

function readRealMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(PHONE_QUERY).matches;
}

export function ViewportPreviewProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewportPreviewMode>(readStoredMode);
  const [isRealMobile, setIsRealMobile] = useState(readRealMobile);

  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY);
    const onChange = () => {
      const mobile = mq.matches;
      setIsRealMobile(mobile);
      if (mobile) setModeState('auto');
    };
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (isRealMobile) setModeState('auto');
  }, [isRealMobile]);

  const setMode = useCallback(
    (next: ViewportPreviewMode) => {
      if (isRealMobile) {
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
