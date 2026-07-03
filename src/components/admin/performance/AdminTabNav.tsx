import { useTestingStageGuide } from '@/hooks/useTestingStageGuide';
import { getTestingStageTheme } from '@/lib/testingStageThemes';

export type AdminTab =
  | 'management'
  | 'angajati'
  | 'responsabilitati'
  | 'evaluari'
  | 'erori'
  | 'supervizor'
  | 'instruire'
  | 'setari';

export const ADMIN_TABS: { id: AdminTab; label: string; description: string }[] = [
  { id: 'management', label: 'Management', description: 'KPI · trend · retenție' },
  { id: 'angajati', label: 'Angajați', description: 'Baza de date & fișe 360°' },
  {
    id: 'responsabilitati',
    label: 'Responsabilități',
    description: 'Mentor · supervizor · etape',
  },
  { id: 'instruire', label: 'Instruire', description: 'Plan grupă & export' },
  { id: 'evaluari', label: 'Evaluări', description: 'Cicluri tri-lunale (90 zile)' },
  { id: 'supervizor', label: 'Supervizor', description: 'Re-instruire & confirmări' },
  { id: 'erori', label: 'Erori & KPI', description: 'Performanță & trend' },
  { id: 'setari', label: 'Setări', description: 'Profile & organizare' },
];

interface AdminTabNavProps {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
}

export function AdminTabNav({ active, onChange }: AdminTabNavProps) {
  const guide = useTestingStageGuide();
  const tabTheme = guide ? getTestingStageTheme(guide.category) : null;

  return (
    <nav
      aria-label="Module panou HR"
      className="grid grid-cols-4 md:grid-cols-8 gap-0.5 rounded-xl border border-corporate-border bg-white p-0.5 mb-6"
    >
      {ADMIN_TABS.map((tab) => {
        const testingTarget = guide?.enabled && tabTheme && guide.adminTab === tab.id;
        return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={[
            'w-full min-w-0 rounded-md px-1.5 py-1.5 text-left transition-colors',
            testingTarget ? `ring-4 ${tabTheme.ring} border-2 ${tabTheme.border}` : '',
            active === tab.id
              ? 'bg-corporate-black text-white shadow-sm'
              : 'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-dark',
          ].join(' ')}
        >
          <span className="block text-xs font-medium leading-tight">{tab.label}</span>
          <span
            className={[
              'block text-[9px] mt-0.5 leading-tight line-clamp-1',
              active === tab.id ? 'text-white/60' : 'text-corporate-muted/80',
            ].join(' ')}
          >
            {tab.description}
          </span>
        </button>
        );
      })}
    </nav>
  );
}
