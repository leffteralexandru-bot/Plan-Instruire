import { useMemo, useState } from 'react';
import { ExpandableModuleRow } from '@/components/ui/ExpandableModuleRow';
import {
  OPERATIONAL_GUIDE_LABELS,
  type OperationalGuideTask,
} from '@/data/operationalGuide';
import { OperationalGuideVideo } from '@/components/operational/OperationalGuideVideo';
import { OperationalGuideEquipmentSection } from '@/components/operational/OperationalGuideEquipmentSection';
import {
  OperationalGuidePreDesignRules,
  OperationalGuidePreMeasurementRules,
} from '@/components/operational/OperationalGuidePreMeasurementRules';
import { OperationalGuideStepsSection } from '@/components/operational/OperationalGuideStepsSection';
import { OperationalGuideToggleTile } from '@/components/operational/OperationalGuideToggleTile';

interface OperationalGuideTaskViewProps {
  task: OperationalGuideTask;
  userId: string;
  readOnly?: boolean;
}

type ActiveGuide = 'measurer' | 'design';

function MeasurerGuideBody({ task, label }: { task: OperationalGuideTask; label: string }) {
  return (
    <div className="space-y-2">
      <OperationalGuidePreMeasurementRules
        conditions={task.preMeasurementConditions}
        categoryLabel={label}
        defaultExpanded={false}
        pdfUrl={task.checklistPdfUrl}
        pdfFileName={task.checklistPdfFileName}
        pageImageUrl={task.checklistPageImageUrl}
      />
      <OperationalGuideEquipmentSection
        items={task.equipment}
        defaultExpanded={false}
        pdfUrl={task.equipmentPdfUrl}
        pdfFileName={task.equipmentPdfFileName}
        pageImageUrl={task.equipmentPageImageUrl}
      />
      <OperationalGuideStepsSection
        taskId={task.id}
        steps={task.steps}
        defaultExpanded={false}
        pdfUrl={task.stepsPdfUrl}
        pdfFileName={task.stepsPdfFileName}
        pageImageUrl={task.stepsPageImageUrl}
      />
      <OperationalGuideVideo url={task.videoUrl} title={task.videoTitle} />
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
        body: <MeasurerGuideBody task={task} label={label} />,
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
