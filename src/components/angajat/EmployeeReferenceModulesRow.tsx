import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExpandableModuleRow } from '@/components/ui/ExpandableModuleRow';
import { OperationalGuidePanel } from '@/components/operational/OperationalGuidePanel';
import { TechnicalRepositoryPanel } from '@/components/technicalRepository/TechnicalRepositoryPanel';
import { EquipmentOperationsPanel } from '@/components/equipment/EquipmentOperationsPanel';

interface EmployeeReferenceModulesRowProps {
  userId: string;
  readOnly?: boolean;
}

type ActiveModule = 'guide' | 'repo' | 'equipment';

/** Utilaje din ghidul de măsurare → deschise în Ghid (nu Mentenanță), ca să rămâi pe ghid */
const GUIDE_EQUIPMENT_DEVICE_TO_DOC: Record<string, string> = {
  'eq-proliner': 'proliner',
  'eq-bosch-gll-3-80': 'gll',
  'eq-bosch-tape-5m': 'ruleta',
};

const EXPAND_LABELS: Record<ActiveModule, string> = {
  guide: 'Ghid operațional · măsurători',
  repo: 'Repository tehnic · documentație',
  equipment: 'Mentenanță și operare echipament',
};

function moduleFromSearch(params: URLSearchParams): ActiveModule | null {
  const ref = params.get('ref');
  const doc = params.get('doc');
  const ghid = params.get('ghid');
  const device = params.get('device');
  if (ref === 'repo' || doc === 'doc-tehnica') return 'repo';
  // Proliner/GLL/Ruletă din link → ghid (chiar dacă URL vechi are ref=equipment)
  if (device && GUIDE_EQUIPMENT_DEVICE_TO_DOC[device]) return 'guide';
  if (ref === 'equipment' || device) return 'equipment';
  if (ref === 'guide' || ghid === 'teren' || ghid === 'proiectare' || (doc && doc !== 'doc-tehnica')) {
    return 'guide';
  }
  return null;
}

/** Ghid + Repository + Mentenanță — butoane fixe pe rând, un singur modul deschis */
export function EmployeeReferenceModulesRow({ userId, readOnly = false }: EmployeeReferenceModulesRowProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive] = useState<ActiveModule | null>(() => moduleFromSearch(searchParams));

  // Linkuri vechi PDF (?ref=equipment&device=eq-proliner) → ghid pe site cu tip + carte
  useEffect(() => {
    const device = searchParams.get('device');
    const docId = device ? GUIDE_EQUIPMENT_DEVICE_TO_DOC[device] : null;
    if (!docId) return;
    if (searchParams.get('doc') === docId && !device) return;

    const tip = searchParams.get('tip') || 'blat';
    const ghid = searchParams.get('ghid') === 'proiectare' ? 'proiectare' : 'teren';
    const next = new URLSearchParams(searchParams);
    next.set('ref', 'guide');
    next.set('ghid', ghid);
    next.set('tip', tip);
    next.set('doc', docId);
    next.delete('device');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fromUrl = moduleFromSearch(searchParams);
    if (fromUrl) setActive(fromUrl);
  }, [searchParams]);

  const toggle = (id: ActiveModule) => (open: boolean) => {
    setActive(open ? id : null);
    const next = new URLSearchParams(searchParams);
    if (open) {
      next.set('ref', id === 'guide' ? 'guide' : id === 'repo' ? 'repo' : 'equipment');
      if (id !== 'guide') {
        next.delete('ghid');
        next.delete('doc');
      }
      if (id !== 'equipment') {
        next.delete('device');
      }
    } else {
      next.delete('ref');
      next.delete('ghid');
      next.delete('doc');
      next.delete('device');
    }
    setSearchParams(next, { replace: true });
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
        body: <OperationalGuidePanel userId={userId} readOnly={readOnly} display="body" />,
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
        body: <TechnicalRepositoryPanel userId={userId} readOnly={readOnly} display="body" />,
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
    // toggle closes over latest searchParams; rebuild when active/user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, readOnly, userId, searchParams],
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
