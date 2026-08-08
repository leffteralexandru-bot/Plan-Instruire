import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import {
  getDesignGuideDevice,
  getDesignGuideStartChapterId,
} from '@/data/designGuideChapters';
import {
  buildFieldGuideDocSearchParams,
  resolveFieldGuideLinkedDoc,
  type FieldGuideLinkedDocId,
} from '@/data/fieldGuideLinkedDocs';
import { EquipmentManualOverlay } from '@/components/operational/OperationalGuideEquipmentManualLinks';
import { FieldGuideDocOverlay } from '@/components/operational/FieldGuideDocOverlay';
import { OperationalGuideToggleTile } from '@/components/operational/OperationalGuideToggleTile';
import {
  DEFAULT_EQUIPMENT_OPERATIONS,
  type EquipmentManualPageActionHotspot,
} from '@/data/equipmentOperations';

interface OperationalGuideTaskViewProps {
  task: OperationalGuideTask;
  userId: string;
  readOnly?: boolean;
}

type ActiveGuide = 'measurer' | 'design';

type OpenDocState = {
  url: string;
  fileName: string;
  title: string;
  eyebrow: string;
};

function useGuideDeepLink(taskId: OperationalGuideTask['id']) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const ghidParam = searchParams.get('ghid');
  const docParam = searchParams.get('doc');

  const syncDocToUrl = (docId: FieldGuideLinkedDocId | null, ghid: ActiveGuide) => {
    const next = new URLSearchParams(searchParams);
    if (!docId) {
      next.delete('doc');
      setSearchParams(next, { replace: true });
      return;
    }
    const built = buildFieldGuideDocSearchParams({
      tip: taskId,
      doc: docId,
      ghid: ghid === 'design' ? 'proiectare' : 'teren',
    });
    built.forEach((value, key) => next.set(key, value));
    // păstrează viewAs dacă există
    const viewAs = searchParams.get('viewAs');
    if (viewAs) next.set('viewAs', viewAs);
    setSearchParams(next, { replace: true });
  };

  const openHref = (href: string) => {
    navigate(href);
  };

  return { ghidParam, docParam, syncDocToUrl, openHref, searchParams, setSearchParams };
}

function MeasurerGuideBody({
  task,
  onCloseManual,
  deepDocId,
  onClearDeepDoc,
}: {
  task: OperationalGuideTask;
  onCloseManual: () => void;
  deepDocId: string | null;
  onClearDeepDoc: () => void;
}) {
  const device = useMemo(() => getFieldGuideDevice(task.id), [task.id]);
  const initialChapterId = useMemo(() => getFieldGuideStartChapterId(task.id), [task.id]);
  const { syncDocToUrl, openHref } = useGuideDeepLink(task.id);
  const [openEquipmentId, setOpenEquipmentId] = useState<string | null>(null);
  const [openDoc, setOpenDoc] = useState<OpenDocState | null>(null);

  const openEquipment = useMemo(
    () =>
      openEquipmentId
        ? DEFAULT_EQUIPMENT_OPERATIONS.devices.find((d) => d.id === openEquipmentId)
        : undefined,
    [openEquipmentId],
  );

  useEffect(() => {
    if (!deepDocId || deepDocId === 'doc-tehnica') return;
    const resolved = resolveFieldGuideLinkedDoc(deepDocId, task.id);
    if (!resolved || resolved.openRepo) return;
    if (resolved.equipmentDeviceId) {
      setOpenEquipmentId(resolved.equipmentDeviceId);
      setOpenDoc(null);
      return;
    }
    if (!resolved.url) return;
    setOpenDoc({
      url: resolved.url,
      fileName: resolved.fileName,
      title: resolved.title,
      eyebrow: resolved.eyebrow,
    });
  }, [deepDocId, task.id]);

  const closeDoc = () => {
    setOpenDoc(null);
    onClearDeepDoc();
  };

  const handleActionHotspot = (spot: EquipmentManualPageActionHotspot) => {
    if (spot.href) {
      openHref(spot.href);
      return;
    }
    if (spot.linkedDocId) {
      const resolved = resolveFieldGuideLinkedDoc(spot.linkedDocId, task.id);
      if (resolved?.openRepo) {
        openHref('/ingineri/panou-angajat?ref=repo&doc=doc-tehnica');
        return;
      }
      if (resolved?.equipmentDeviceId) {
        syncDocToUrl(resolved.id, 'measurer');
        setOpenEquipmentId(resolved.equipmentDeviceId);
        setOpenDoc(null);
        return;
      }
      if (resolved?.url) {
        syncDocToUrl(resolved.id, 'measurer');
        setOpenDoc({
          url: resolved.url,
          fileName: resolved.fileName,
          title: resolved.title,
          eyebrow: resolved.eyebrow,
        });
        return;
      }
    }
    if (spot.deviceId) {
      setOpenEquipmentId(spot.deviceId);
      return;
    }
    if (spot.docUrl && spot.docFileName) {
      setOpenDoc({
        url: spot.docUrl,
        fileName: spot.docFileName,
        title: spot.label,
        eyebrow: 'Document ghid · același fișier ca în PDF',
      });
      return;
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
          onClose={() => {
            setOpenEquipmentId(null);
            if (
              deepDocId === 'proliner' ||
              deepDocId === 'gll' ||
              deepDocId === 'ruleta'
            ) {
              onClearDeepDoc();
            }
          }}
        />
      ) : null}

      {openDoc ? (
        <FieldGuideDocOverlay
          pdfUrl={openDoc.url}
          pdfFileName={openDoc.fileName}
          title={openDoc.title}
          eyebrow={openDoc.eyebrow}
          onClose={closeDoc}
        />
      ) : null}
    </div>
  );
}

function DesignGuideBody({
  task,
  onCloseManual,
  deepDocId,
  onClearDeepDoc,
}: {
  task: OperationalGuideTask;
  onCloseManual: () => void;
  deepDocId: string | null;
  onClearDeepDoc: () => void;
}) {
  const device = useMemo(() => getDesignGuideDevice(task.id), [task.id]);
  const initialChapterId = useMemo(() => getDesignGuideStartChapterId(task.id), [task.id]);
  const label = OPERATIONAL_GUIDE_LABELS[task.id];
  const { syncDocToUrl } = useGuideDeepLink(task.id);
  const [openDoc, setOpenDoc] = useState<OpenDocState | null>(null);

  useEffect(() => {
    if (!deepDocId || deepDocId === 'doc-tehnica') return;
    const resolved = resolveFieldGuideLinkedDoc(deepDocId, task.id);
    if (!resolved || resolved.openRepo || !resolved.url) return;
    setOpenDoc({
      url: resolved.url,
      fileName: resolved.fileName,
      title: resolved.title,
      eyebrow: resolved.eyebrow,
    });
  }, [deepDocId, task.id]);

  const closeDoc = () => {
    setOpenDoc(null);
    onClearDeepDoc();
  };

  const handleActionHotspot = (spot: EquipmentManualPageActionHotspot) => {
    if (spot.linkedDocId) {
      const resolved = resolveFieldGuideLinkedDoc(spot.linkedDocId, task.id);
      if (resolved?.url) {
        syncDocToUrl(resolved.id, 'design');
        setOpenDoc({
          url: resolved.url,
          fileName: resolved.fileName,
          title: resolved.title,
          eyebrow: resolved.eyebrow,
        });
        return;
      }
    }
    if (spot.docUrl && spot.docFileName) {
      setOpenDoc({
        url: spot.docUrl,
        fileName: spot.docFileName,
        title: spot.label,
        eyebrow: `Document proiectare · ${label}`,
      });
    }
  };

  return (
    <div className="space-y-2">
      <EquipmentGuideDeviceView
        key={`${device.id}-${task.id}`}
        device={device}
        manualNumber={2}
        initialChapterId={initialChapterId}
        onBack={onCloseManual}
        onActionHotspot={handleActionHotspot}
      />

      {openDoc ? (
        <FieldGuideDocOverlay
          pdfUrl={openDoc.url}
          pdfFileName={openDoc.fileName}
          title={openDoc.title}
          eyebrow={openDoc.eyebrow}
          onClose={closeDoc}
        />
      ) : null}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const ghidParam = searchParams.get('ghid');
  const docParam = searchParams.get('doc');

  const [active, setActive] = useState<ActiveGuide | null>(() => {
    if (ghidParam === 'proiectare') return 'design';
    if (ghidParam === 'teren') return 'measurer';
    if (docParam) return 'measurer';
    return null;
  });

  useEffect(() => {
    if (ghidParam === 'proiectare') setActive('design');
    else if (ghidParam === 'teren') setActive('measurer');
    else if (docParam && docParam !== 'doc-tehnica') setActive('measurer');
  }, [ghidParam, docParam]);

  const clearDeepDoc = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('doc');
    setSearchParams(next, { replace: true });
  };

  const toggle = (id: ActiveGuide) => {
    setActive((current) => {
      const next = current === id ? null : id;
      const params = new URLSearchParams(searchParams);
      if (next === 'measurer') params.set('ghid', 'teren');
      else if (next === 'design') params.set('ghid', 'proiectare');
      else params.delete('ghid');
      if (!next) params.delete('doc');
      params.set('tip', task.id);
      params.set('ref', 'guide');
      setSearchParams(params, { replace: true });
      return next;
    });
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
        body: (
          <MeasurerGuideBody
            task={task}
            onCloseManual={() => setActive(null)}
            deepDocId={active === 'measurer' ? docParam : null}
            onClearDeepDoc={clearDeepDoc}
          />
        ),
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
        body: (
          <DesignGuideBody
            task={task}
            onCloseManual={() => setActive(null)}
            deepDocId={active === 'design' ? docParam : null}
            onClearDeepDoc={clearDeepDoc}
          />
        ),
      },
    ],
    // toggle/clearDeepDoc are stable enough for this UI; params drive deep-link reopen
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, label, task, docParam],
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
