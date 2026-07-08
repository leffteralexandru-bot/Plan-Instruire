import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type MenuPlacement = 'left' | 'right' | 'top' | 'bottom';

const STORAGE_KEY = 'artgranit_menu_placement';
const LEGACY_KEY = 'artgranit_sidebar_placement';

function readPlacement(): MenuPlacement {
  try {
    const v = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (v === 'left' || v === 'right' || v === 'top' || v === 'bottom') return v;
  } catch {
    /* ignore */
  }
  return 'left';
}

interface LayoutPreferencesContextValue {
  menuPlacement: MenuPlacement;
  setMenuPlacement: (value: MenuPlacement) => void;
  isSidebar: boolean;
  isTopMenu: boolean;
  isBottomMenu: boolean;
}

const LayoutPreferencesContext = createContext<LayoutPreferencesContextValue | null>(null);

export function LayoutPreferencesProvider({ children }: { children: ReactNode }) {
  const [menuPlacement, setMenuPlacementState] = useState<MenuPlacement>(() => readPlacement());

  const setMenuPlacement = useCallback((value: MenuPlacement) => {
    setMenuPlacementState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      menuPlacement,
      setMenuPlacement,
      isSidebar: menuPlacement === 'left' || menuPlacement === 'right',
      isTopMenu: menuPlacement === 'top',
      isBottomMenu: menuPlacement === 'bottom',
    }),
    [menuPlacement, setMenuPlacement],
  );

  return (
    <LayoutPreferencesContext.Provider value={value}>{children}</LayoutPreferencesContext.Provider>
  );
}

export function useLayoutPreferences() {
  const ctx = useContext(LayoutPreferencesContext);
  if (!ctx) throw new Error('useLayoutPreferences must be used within LayoutPreferencesProvider');
  return ctx;
}

/** @deprecated */
export type SidebarPlacement = 'left' | 'right';
