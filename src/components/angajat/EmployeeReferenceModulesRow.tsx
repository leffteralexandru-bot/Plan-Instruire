import { useMemo, useState } from 'react';
import { ExpandableModuleRow } from '@/components/ui/ExpandableModuleRow';
import { OperationalGuidePanel } from '@/components/operational/OperationalGuidePanel';
import { TechnicalRepositoryPanel } from '@/components/technicalRepository/TechnicalRepositoryPanel';
import { EquipmentOperationsPanel } from '@/components/equipment/EquipmentOperationsPanel';

interface EmployeeReferenceModulesRowProps {
  userId: string;
  readOnly?: boolean;
}

type ActiveModule = 'guide' | 'repo' | 'equipment';

const EXPAND_LABELS: Record<ActiveModule, string> = {
  guide: 'Ghid operațional · măsurători',
  repo: 'Repository tehnic · documentație',
  equipment: 'Mentenanță și operare echipament',
};

/** Ghid + Repository + Mentenanță — butoane fixe pe rând, un singur modul deschis */
export function EmployeeReferenceModulesRow({ userId, readOnly = false }: EmployeeReferenceModulesRowProps) {
  const [active, setActive] = useState<ActiveModule | null>(null);

  const toggle = (id: ActiveModule) => (open: boolean) => {
    setActive(open ? id : null);
  };

  const modules = useMemo(
    () => [
      {
        id: 'guide' as const,
        header: (
          <OperationalGuidePanel
            userId={userId}
            readOnly={readOnly}
            display="header"
            expanded={active === 'guide'}
            onExpandedChange={toggle('guide')}
          />
        ),
        body: (
          <OperationalGuidePanel userId={userId} readOnly={readOnly} display="body" />
        ),
      },
      {
        id: 'repo' as const,
        header: (
          <TechnicalRepositoryPanel
            userId={userId}
            readOnly={readOnly}
            display="header"
            expanded={active === 'repo'}
            onExpandedChange={toggle('repo')}
          />
        ),
        body: (
          <TechnicalRepositoryPanel userId={userId} readOnly={readOnly} display="body" />
        ),
      },
      {
        id: 'equipment' as const,
        header: (
          <EquipmentOperationsPanel
            readOnly={readOnly}
            display="header"
            expanded={active === 'equipment'}
            onExpandedChange={toggle('equipment')}
          />
        ),
        body: <EquipmentOperationsPanel display="body" />,
      },
    ],
    [active, readOnly, userId],
  );

  const activeIndex = active !== null ? modules.findIndex((m) => m.id === active) : null;
  const activeModule = active !== null ? modules.find((m) => m.id === active) : null;

  return (
    <ExpandableModuleRow
      columnCount={3}
      activeColumnIndex={activeIndex !== null && activeIndex >= 0 ? activeIndex : null}
      headers={modules.map((m) => m.header)}
      expandedContent={activeModule?.body ?? null}
      expandLabel={active ? EXPAND_LABELS[active] : undefined}
    />
  );
}
