export type AdminTab = 'angajati' | 'evaluari' | 'erori' | 'instruire' | 'setari';

export const ADMIN_TABS: { id: AdminTab; label: string; description: string }[] = [
  { id: 'angajati', label: 'Angajați', description: 'Baza de date & fișe 360°' },
  { id: 'evaluari', label: 'Evaluări', description: 'Cicluri tri-lunale (90 zile)' },
  { id: 'erori', label: 'Erori & KPI', description: 'Performanță & trend' },
  { id: 'instruire', label: 'Instruire', description: 'Plan cohortă & export' },
  { id: 'setari', label: 'Setări', description: 'Organizare & backup' },
];

interface AdminTabNavProps {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
}

export function AdminTabNav({ active, onChange }: AdminTabNavProps) {
  return (
    <nav
      aria-label="Module panou HR"
      className="flex gap-1 overflow-x-auto rounded-xl border border-corporate-border bg-white p-1 mb-6"
    >
      {ADMIN_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={[
            'shrink-0 rounded-lg px-3 py-2 text-left transition-colors min-w-[7rem]',
            active === tab.id
              ? 'bg-corporate-black text-white shadow-sm'
              : 'text-corporate-muted hover:bg-corporate-surface hover:text-corporate-dark',
          ].join(' ')}
        >
          <span className="block text-sm font-medium">{tab.label}</span>
          <span
            className={[
              'block text-[10px] mt-0.5',
              active === tab.id ? 'text-white/60' : 'text-corporate-muted/80',
            ].join(' ')}
          >
            {tab.description}
          </span>
        </button>
      ))}
    </nav>
  );
}
