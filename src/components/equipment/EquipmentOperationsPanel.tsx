import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import {
  EQUIPMENT_GUIDE_SECTIONS,
  isEquipmentChapterGuide,
  type EquipmentDevice,
  type EquipmentGuideSectionId,
} from '@/data/equipmentOperations';
import { useEquipmentOperations } from '@/hooks/useEquipmentOperations';
import { EquipmentGuideDeviceView } from '@/components/equipment/EquipmentGuideDeviceView';
import { EquipmentOperationsSectionView } from '@/components/equipment/EquipmentOperationsSectionView';

type EquipmentDisplay = 'inline' | 'header' | 'body';

interface EquipmentOperationsPanelProps {
  readOnly?: boolean;
  display?: EquipmentDisplay;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

function DeviceCard({
  device,
  onClick,
}: {
  device: EquipmentDevice;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-xl border border-corporate-border bg-white px-4 py-3.5 hover:border-corporate-gold/50 hover:bg-corporate-gold-light/10 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-corporate-dark group-hover:text-corporate-black">
            {device.name}
          </p>
          {device.description && (
            <p className="text-xs text-corporate-muted mt-1 leading-snug">{device.description}</p>
          )}
        </div>
        <Badge variant="default">{device.category}</Badge>
      </div>
      <span className="text-[10px] text-corporate-gold mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
        Deschide ghidul →
      </span>
    </button>
  );
}

function EquipmentOperationsContent() {
  const data = useEquipmentOperations();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<EquipmentGuideSectionId | null>(null);

  const device = data.devices.find((d) => d.id === deviceId) ?? null;
  const sectionMeta = sectionId
    ? EQUIPMENT_GUIDE_SECTIONS.find((s) => s.id === sectionId)
    : null;

  if (!device) {
    return (
      <div className="space-y-4">
        {data.intro && <p className="text-sm text-corporate-muted leading-relaxed">{data.intro}</p>}
        {data.devices.length === 0 ? (
          <p className="text-sm text-corporate-muted italic">HR va adăuga aparatele de măsurat.</p>
        ) : (
          <div className="grid gap-2">
            {data.devices.map((d) => (
              <DeviceCard key={d.id} device={d} onClick={() => setDeviceId(d.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!sectionId) {
    if (isEquipmentChapterGuide(device)) {
      return <EquipmentGuideDeviceView device={device} onBack={() => setDeviceId(null)} />;
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-corporate-border/80 pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-corporate-muted">Aparat</p>
            <p className="text-sm font-semibold text-corporate-dark">{device.name}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setDeviceId(null)}>
            ← Înapoi la aparate
          </Button>
        </div>

        <div className="grid gap-2">
          {EQUIPMENT_GUIDE_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectionId(s.id)}
              className="group w-full text-left rounded-xl border border-corporate-border bg-white px-4 py-3.5 hover:border-corporate-gold/50 hover:bg-corporate-gold-light/10 transition-all"
            >
              <p className="text-sm font-semibold text-corporate-dark">{s.label}</p>
              <p className="text-xs text-corporate-muted mt-1">{s.description}</p>
              <span className="text-[10px] text-corporate-gold mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                Deschide →
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const section = device[sectionId];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-corporate-border/80 pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-corporate-muted">
            {device.name} · {sectionMeta?.label}
          </p>
          <p className="text-sm font-semibold text-corporate-dark">{sectionMeta?.description}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setSectionId(null)}>
          ← Înapoi la secțiuni
        </Button>
      </div>

      <EquipmentOperationsSectionView section={section} />
    </div>
  );
}

export function EquipmentOperationsPanel({
  readOnly: _readOnly = false,
  display = 'inline',
  expanded: expandedProp,
  onExpandedChange,
}: EquipmentOperationsPanelProps) {
  const data = useEquipmentOperations();
  const [expandedInternal, setExpandedInternal] = useState(false);

  const expanded = display === 'header' ? !!expandedProp : expandedInternal;
  const deviceCount = data.devices.length;

  const handleToggle = () => {
    if (display === 'header') {
      onExpandedChange?.(!expanded);
      return;
    }
    setExpandedInternal((v) => {
      const next = !v;
      onExpandedChange?.(next);
      return next;
    });
  };

  if (display === 'body') {
    return <EquipmentOperationsContent />;
  }

  return (
    <ProfessionalPanel
      variant="evaluation"
      icon="activity"
      eyebrow="Utilaje teren"
      title="Mentenanță și operare echipament"
      subtitle="Ghiduri capitole · PDF offline · siguranță · media"
      collapsible
      expanded={expanded}
      onToggle={handleToggle}
      bodyDetached={display === 'header'}
      headerTile={display === 'header'}
      tileTitle={display === 'header' ? 'Operarea echipament' : undefined}
      toggleLabels={{
        expanded: 'Restrânge mentenanța',
        collapsed: 'Deschide mentenanță echipament',
      }}
      badge={
        <span className="text-[10px] font-medium text-corporate-muted tabular-nums">
          {deviceCount} aparate
        </span>
      }
      collapsedPeek={
        <p className="text-sm text-corporate-muted">
          Ghiduri pentru aparatele de măsurat — curățare, mod de lucru și fișiere CAD.
        </p>
      }
    >
      <EquipmentOperationsContent />
    </ProfessionalPanel>
  );
}
