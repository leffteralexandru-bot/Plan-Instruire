import { NavLink } from 'react-router-dom';
import { NavIcon } from '@/components/layout/NavIcon';
import { useAppMenu } from '@/context/AppMenuContext';
import { useDevicePreview } from '@/context/DevicePreviewContext';
import { useTestingStageGuide } from '@/hooks/useTestingStageGuide';
import { isTestingNavTarget } from '@/lib/testingStageGuide';
import { getTestingStageTheme } from '@/lib/testingStageThemes';

export function BottomNavigation() {
  const { bottomPrimary, openMenu } = useAppMenu();
  const { isMobileLayout, isSimulated } = useDevicePreview();
  const guide = useTestingStageGuide();
  const navTheme = guide ? getTestingStageTheme(guide.category) : null;

  if (!isMobileLayout || bottomPrimary.length === 0) return null;

  return (
    <nav
      aria-label="Navigare principală mobilă"
      className={[
        isSimulated ? 'absolute' : 'fixed',
        'inset-x-0 bottom-0 z-50 border-t border-white/10 bg-corporate-black/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]',
      ].join(' ')}
    >
      <div className="flex items-stretch justify-around">
        {bottomPrimary.slice(0, 4).map((link) => {
          const testTarget = guide && navTheme && isTestingNavTarget(link.to, guide);
          return (
            <NavLink
              key={link.to + link.label}
              to={link.to}
              end={link.end}
              aria-label={link.label}
              className={({ isActive }) =>
                [
                  'touch-target flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-white/60 transition-colors',
                  'hover:text-corporate-gold',
                  isActive ? 'text-corporate-gold' : '',
                  testTarget ? `ring-2 ring-inset ${navTheme?.navRing ?? 'ring-corporate-gold/50'}` : '',
                ].join(' ')
              }
            >
              <NavIcon id={link.icon} className="h-6 w-6 shrink-0" />
              <span className="sr-only">{link.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          aria-label="Mai multe opțiuni și setări"
          onClick={openMenu}
          className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-white/60 transition-colors hover:text-corporate-gold"
        >
          <NavIcon id="more" className="h-6 w-6 shrink-0" />
          <span className="text-[10px] font-medium leading-none truncate max-w-[4rem]">Mai mult</span>
        </button>
      </div>
    </nav>
  );
}
