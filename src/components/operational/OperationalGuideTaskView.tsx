import { useMemo, useState } from 'react';
import { ExpandableModuleRow } from '@/components/ui/ExpandableModuleRow';
import { EquipmentGuideDeviceView } from '@/components/equipment/EquipmentGuideDeviceView';
import {
  OPERATIONAL_GUIDE_LABELS,
  type OperationalGuideTask,
} from '@/data/operationalGuide';
import {
  getFieldGuideDevice,
  getFieldGuideStartChapterId,
} from '@/data/fieldGuideChapters';
import { EquipmentManualOverlay } from '@/components/operational/OperationalGuideEquipmentManualLinks';
import { FieldGuideDocOverlay } from '@/components/operational/FieldGuideDocOverlay';
import { OperationalGuidePreDesignRules } from '@/components/operational/OperationalGuidePreMeasurementRules';
import { OperationalGuideStepsSection } from '@/components/operational/OperationalGuideStepsSection';
import { OperationalGuideToggleTile } from '@/components/operational/OperationalGuideToggleTile';
import { DEFAULT_EQUIPMENT_OPERATIONS, type EquipmentManualPageActionHotspot } from '@/data/equipmentOperations';

interface OperationalGuideTaskViewProps {
  task: OperationalGuideTask;
  userId: string;
  readOnly?: boolean;
}

type ActiveGuide = 'measurer' | 'design';

function MeasurerGuideBody({
  task,
  onCloseManual,
}: {
  task: OperationalGuideTask;
  onCloseManual: () => void;
}) {
  const device = useMemo(() => getFieldGuideDevice(task.id), [task.id]);
  const initialChapterId = useMemo(() => getFieldGuideStartChapterId(task.id), [task.id]);
  const label = OPERATIONAL_GUIDE_LABELS[task.id];
  const [openEquipmentId, setOpenEquipmentId] = useState<string | null>(null);
  const [openDoc, setOpenDoc] = useState<{ url: string; fileName: string; title: string } | null>(
    null,
  );

  const openEquipment = useMemo(
    () =>
      openEquipmentId
        ? DEFAULT_EQUIPMENT_OPERATIONS.devices.find((d) => d.id === openEquipmentId)
        : undefined,
    [openEquipmentId],
  );

  const handleActionHotspot = (spot: EquipmentManualPageActionHotspot) => {
    if (spot.docUrl && spot.docFileName) {
      setOpenDoc({ url: spot.docUrl, fileName: spot.docFileName, title: spot.label });
      return;
    }
    if (spot.deviceId) {
      setOpenEquipmentId(spot.deviceId);
    }
  };

  return (
    <div className="space-y-2">
      <EquipmentGuideDeviceView
        key={`${device.id}-${task.id}`}
        device={device}
        manualNumber={1}
        initialChapterId={initialChapterId}
        onBack={onCloseManual}
        onActionHotspot={handleActionHotspot}
      />

      {openEquipment ? (
        <EquipmentManualOverlay
          device={openEquipment}
          onClose={() => setOpenEquipmentId(null)}
        />
      ) : null}

      {openDoc ? (
        <FieldGuideDocOverlay
          pdfUrl={openDoc.url}
          pdfFileName={openDoc.fileName}
          title={openDoc.title}
          eyebrow={
            openDoc.title.includes('Checklist')
              ? `Checklist Client · șablon · ${label}`
              : openDoc.title.includes('Fișe tehnice')
                ? 'Fișe tehnice accesorii · exemple'
                : openDoc.title.includes('CTG') || openDoc.title.includes('Comanda_Material')
                  ? 'CTG · Comandă material · șablon'
                  : openDoc.title === 'Canting'
                    ? 'Canting · șablon nesting'
                    : 'Anexa 1 · șablon'
          }
          onClose={() => setOpenDoc(null)}
        />
      ) : null}
    </div>
  );
}

function DesignGuideBody({ task, label }: { task: OperationalGuideTask; label: string }) {
  return (
    <div className="space-y-2">
      <OperationalGuidePreDesignRules
        conditions={task.preDesignConditions ?? []}
        categoryLabel={label}
        defaultExpanded={false}
      />
      <OperationalGuideStepsSection
        taskId={`design-${task.id}`}
        steps={task.designSteps ?? []}
        defaultExpanded={false}
        eyebrow="La birou"
        title="Pași de proiectare"
        subtitle="Ordinea la proiectare — adaptată tipului selectat (diferită de pașii pe teren)."
        emptyMessage="Pașii de proiectare vor fi adăugați separat — diferiți de pașii de măsurare."
      />
    </div>
  );
}

function OperationalGuideTaskContextHeader({ task }: { task: OperationalGuideTask }) {
  const label = OPERATIONAL_GUIDE_LABELS[task.id];

  return (
    <p className="text-[11px] sm:text-xs text-corporate-muted leading-snug">
      Ghidurile <span className="font-medium text-corporate-dark">Măsurare</span> și{' '}
      <span className="font-medium text-corporate-dark">Proiectare</span>:{' '}
      <span className="font-semibold text-corporate-dark">{label}</span>
      {task.categorySubtitle ? (
        <span className="text-corporate-muted"> · {task.categorySubtitle}</span>
      ) : null}
    </p>
  );
}

export function OperationalGuideTaskView({ task }: OperationalGuideTaskViewProps) {
  const label = OPERATIONAL_GUIDE_LABELS[task.id];
  const [active, setActive] = useState<ActiveGuide | null>(null);

  const toggle = (id: ActiveGuide) => {
    setActive((current) => (current === id ? null : id));
  };

  const modules = useMemo(
    () => [
      {
        id: 'measurer' as const,
        header: (
          <OperationalGuideToggleTile
            eyebrow="Ghid măsurător"
            actionLabel="Măsurare"
            categoryLabel={label}
            mobileLabel="Masurare"
            expanded={active === 'measurer'}
            onToggle={() => toggle('measurer')}
            ariaLabel={`Ghid măsurător — Măsurare ${label}`}
          />
        ),
        body: <MeasurerGuideBody task={task} onCloseManual={() => setActive(null)} />,
      },
      {
        id: 'design' as const,
        header: (
          <OperationalGuideToggleTile
            eyebrow="Ghid Proiectare"
            actionLabel="Proiectare"
            categoryLabel={label}
            mobileLabel="Proiectare"
            expanded={active === 'design'}
            onToggle={() => toggle('design')}
            ariaLabel={`Ghid Proiectare — Proiectare ${label}`}
          />
        ),
        body: <DesignGuideBody task={task} label={label} />,
      },
    ],
    [active, label, task],
  );

  const activeIndex = active !== null ? modules.findIndex((m) => m.id === active) : null;
  const activeModule = active !== null ? modules.find((m) => m.id === active) : null;

  return (
    <div className="space-y-4">
      {task.updatedAt && (
        <p className="text-[10px] text-corporate-muted">
          Actualizat {new Date(task.updatedAt).toLocaleDateString('ro-RO')}
          {task.updatedByName ? ` · ${task.updatedByName}` : ''}
        </p>
      )}

      <ExpandableModuleRow
        columnCount={2}
        activeColumnIndex={activeIndex !== null && activeIndex >= 0 ? activeIndex : null}
        topHeader={<OperationalGuideTaskContextHeader task={task} />}
        headers={modules.map((m) => m.header)}
        expandedContent={activeModule?.body ?? null}
      />
    </div>
  );
}
