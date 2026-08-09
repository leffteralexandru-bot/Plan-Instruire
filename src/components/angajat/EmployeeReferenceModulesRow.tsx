import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExpandableModuleRow } from '@/components/ui/ExpandableModuleRow';
import { OperationalGuidePanel } from '@/components/operational/OperationalGuidePanel';
import { TechnicalRepositoryPanel } from '@/components/technicalRepository/TechnicalRepositoryPanel';
import { EquipmentOperationsPanel } from '@/components/equipment/EquipmentOperationsPanel';
import {
  EQUIPMENT_DEVICE_TO_FIELD_GUIDE_DOC,
  FIELD_GUIDE_DOC_TO_EQUIPMENT_DEVICE,
  type FieldGuideLinkedDocId,
} from '@/data/fieldGuideLinkedDocs';

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

function moduleFromSearch(params: URLSearchParams): ActiveModule | null {
  const ref = params.get('ref');
  const doc = params.get('doc');
  const ghid = params.get('ghid');
  const device = params.get('device');
  if (ref === 'repo' || doc === 'doc-tehnica') return 'repo';
  // Utilaje (Proliner/GLL/Ruletă) → Mentenanță, chiar dacă ghid/tip rămân ca origin
  if (ref === 'equipment' || device) return 'equipment';
  if (doc && FIELD_GUIDE_DOC_TO_EQUIPMENT_DEVICE[doc as FieldGuideLinkedDocId]) {
    return 'equipment';
  }
  if (ref === 'guide' || ghid === 'teren' || ghid === 'proiectare' || (doc && doc !== 'doc-tehnica')) {
    return 'guide';
  }
  return null;
}

/** Ghid + Repository + Mentenanță — butoane fixe pe rând, un singur modul deschis */
export function EmployeeReferenceModulesRow({ userId, readOnly = false }: EmployeeReferenceModulesRowProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive] = useState<ActiveModule | null>(() => moduleFromSearch(searchParams));

  // doc=proliner|gll|ruleta (link vechi) → Mentenanță + device, păstrează ghid/tip pentru Înapoi
  useEffect(() => {
    const doc = searchParams.get('doc') as FieldGuideLinkedDocId | null;
    const deviceFromDoc = doc ? FIELD_GUIDE_DOC_TO_EQUIPMENT_DEVICE[doc] : undefined;
    if (!deviceFromDoc) return;
    if (searchParams.get('device') === deviceFromDoc && searchParams.get('ref') === 'equipment') {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('ref', 'equipment');
    next.set('device', deviceFromDoc);
    next.set('from', 'guide');
    if (!next.get('ghid')) next.set('ghid', 'teren');
    if (!next.get('tip')) next.set('tip', 'blat');
    next.delete('doc');
    // ch / page rămân dacă existau (Înapoi la aceeași pagină din ghid)
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // device fără from, dar cu tip/ghid din PDF → marchează origin ghid
  useEffect(() => {
    const device = searchParams.get('device');
    if (!device || !EQUIPMENT_DEVICE_TO_FIELD_GUIDE_DOC[device]) return;
    if (searchParams.get('from') === 'guide') return;
    if (!searchParams.get('tip') && !searchParams.get('ghid')) return;
    const next = new URLSearchParams(searchParams);
    next.set('ref', 'equipment');
    next.set('from', 'guide');
    if (!next.get('ghid')) next.set('ghid', 'teren');
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
      if (id === 'guide') {
        next.delete('device');
        next.delete('from');
      } else if (id === 'repo') {
        next.delete('ghid');
        next.delete('tip');
        next.delete('device');
        next.delete('from');
        next.delete('doc');
      } else {
        // Mentenanță: la deschidere manuală curățăm origin/doc; deep-link le pune singur
        next.delete('doc');
        if (!searchParams.get('device')) {
          next.delete('from');
          next.delete('ghid');
          next.delete('tip');
        }
      }
    } else {
      next.delete('ref');
      next.delete('ghid');
      next.delete('doc');
      next.delete('device');
      next.delete('from');
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
