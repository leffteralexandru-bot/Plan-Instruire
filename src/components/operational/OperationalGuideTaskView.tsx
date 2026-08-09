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
import { FieldGuideDocOverlay } from '@/components/operational/FieldGuideDocOverlay';
import { OperationalGuideToggleTile } from '@/components/operational/OperationalGuideToggleTile';
import { type EquipmentManualPageActionHotspot } from '@/data/equipmentOperations';
import {
  consumeGuideReturnSnapshot,
  guidePageDomId,
  saveGuideReturnSnapshot,
} from '@/lib/guideReturnState';
import { openPdfInNewTab, prefersExternalPdfOpen } from '@/lib/pdfViewer';

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

/** Pe telefon: deschide PDF în tab nou din gestul de tap (iframe-ul mobil e gol). */
function openDocPanel(setOpenDoc: (doc: OpenDocState) => void, doc: OpenDocState) {
  if (prefersExternalPdfOpen()) {
    openPdfInNewTab(doc.url);
  }
  setOpenDoc(doc);
}

type GuidePlace = {
  chapterId?: string | null;
  pageId?: string | null;
};

function useGuideDeepLink(taskId: OperationalGuideTask['id']) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const ghidParam = searchParams.get('ghid');
  const docParam = searchParams.get('doc');
  const chapterParam = searchParams.get('ch');
  const pageParam = searchParams.get('page');

  const syncDocToUrl = (
    docId: FieldGuideLinkedDocId | null,
    ghid: ActiveGuide,
    place?: GuidePlace,
  ) => {
    const next = new URLSearchParams(searchParams);
    next.delete('doc');
    next.delete('device');
    next.delete('from');
    if (!docId) {
      setSearchParams(next, { replace: true });
      return;
    }
    const built = buildFieldGuideDocSearchParams({
      tip: taskId,
      doc: docId,
      ghid: ghid === 'design' ? 'proiectare' : 'teren',
      chapterId: place?.chapterId,
      pageId: place?.pageId,
    });
    built.forEach((value, key) => next.set(key, value));
    const viewAs = searchParams.get('viewAs');
    if (viewAs) next.set('viewAs', viewAs);
    setSearchParams(next, { replace: true });
  };

  const openHref = (href: string) => {
    navigate(href);
  };

  return {
    ghidParam,
    docParam,
    chapterParam,
    pageParam,
    syncDocToUrl,
    openHref,
    searchParams,
    setSearchParams,
  };
}

function MeasurerGuideBody({
  task,
  onCloseManual,
  deepDocId,
  onClearDeepDoc,
  openSession,
}: {
  task: OperationalGuideTask;
  onCloseManual: () => void;
  deepDocId: string | null;
  onClearDeepDoc: () => void;
  /** Incrementează la fiecare (re)deschidere → remount pe Cuprins */
  openSession: number;
}) {
  const device = useMemo(() => getFieldGuideDevice(task.id), [task.id]);
  const defaultChapterId = useMemo(() => getFieldGuideStartChapterId(task.id), [task.id]);
  const { syncDocToUrl, openHref, chapterParam, pageParam } = useGuideDeepLink(task.id);
  const [openDoc, setOpenDoc] = useState<OpenDocState | null>(null);

  // Fără ch/page în URL → mereu Cuprins (nu ultimul capitol din sesiunea anterioară)
  const initialChapterId = chapterParam || defaultChapterId;

  // După Înapoi din Mentenanță: același capitol + pagina + scroll
  useEffect(() => {
    // Cât timp e deschis un PDF (Anexa etc.), nu derula la pagina ghid — rămâi pe antetul documentului
    // openDoc acoperă frame-ul înainte ca `doc` din URL să ajungă în deepDocId
    if (deepDocId || openDoc) return;
    if (!chapterParam && !pageParam) return;
    const snap = consumeGuideReturnSnapshot();
    const pageId = snap?.pageId || pageParam;
    const scrollY = snap?.scrollY ?? 0;
    const restore = () => {
      if (pageId) {
        const el = document.getElementById(guidePageDomId(pageId));
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      if (snap) window.scrollTo({ top: scrollY, behavior: 'smooth' });
    };
    const t = window.setTimeout(restore, 120);
    return () => window.clearTimeout(t);
  }, [task.id, chapterParam, pageParam, deepDocId, openDoc]);

  useEffect(() => {
    if (!deepDocId || deepDocId === 'doc-tehnica') return;
    const resolved = resolveFieldGuideLinkedDoc(deepDocId, task.id);
    if (!resolved || resolved.openRepo) return;
    if (resolved.equipmentDeviceId) {
      syncDocToUrl(resolved.id, 'measurer', {
        chapterId: chapterParam,
        pageId: pageParam,
      });
      return;
    }
    if (!resolved.url) return;
    setOpenDoc({
      url: resolved.url,
      fileName: resolved.fileName,
      title: resolved.title,
      eyebrow: resolved.eyebrow,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reopen when deepDocId/tip change
  }, [deepDocId, task.id]);

  const closeDoc = () => {
    setOpenDoc(null);
    onClearDeepDoc();
  };

  const rememberPlaceAndOpen = (docId: FieldGuideLinkedDocId, place?: GuidePlace) => {
    saveGuideReturnSnapshot({
      ghid: 'teren',
      tip: task.id,
      chapterId: place?.chapterId ?? chapterParam,
      pageId: place?.pageId ?? pageParam,
      scrollY: window.scrollY,
    });
    syncDocToUrl(docId, 'measurer', place);
  };

  const handleActionHotspot = (
    spot: EquipmentManualPageActionHotspot,
    ctx?: { chapterId: string; pageId?: string },
  ) => {
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
        rememberPlaceAndOpen(resolved.id, {
          chapterId: ctx?.chapterId,
          pageId: ctx?.pageId,
        });
        return;
      }
      if (resolved?.url) {
        syncDocToUrl(resolved.id, 'measurer', {
          chapterId: ctx?.chapterId,
          pageId: ctx?.pageId,
        });
        openDocPanel(setOpenDoc, {
          url: resolved.url,
          fileName: resolved.fileName,
          title: resolved.title,
          eyebrow: resolved.eyebrow,
        });
        return;
      }
    }
    if (spot.deviceId) {
      const docId: FieldGuideLinkedDocId =
        spot.deviceId === 'eq-proliner'
          ? 'proliner'
          : spot.deviceId === 'eq-bosch-gll-3-80'
            ? 'gll'
            : spot.deviceId === 'eq-bosch-tape-5m'
              ? 'ruleta'
              : 'proliner';
      rememberPlaceAndOpen(docId, {
        chapterId: ctx?.chapterId,
        pageId: ctx?.pageId,
      });
      return;
    }
    if (spot.docUrl && spot.docFileName) {
      openDocPanel(setOpenDoc, {
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
      {openDoc ? (
        <FieldGuideDocOverlay
          placement="panel"
          pdfUrl={openDoc.url}
          pdfFileName={openDoc.fileName}
          title={openDoc.title}
          eyebrow={openDoc.eyebrow}
          returnLabel="Închide"
          contextHint={`Extindere deasupra manualului ghid — Ghid măsurare (${OPERATIONAL_GUIDE_LABELS[task.id]}). Meniul de sus rămâne vizibil.`}
          onClose={closeDoc}
        />
      ) : null}
      <div className={openDoc ? 'opacity-45 pointer-events-none select-none' : undefined} aria-hidden={openDoc ? true : undefined}>
        <EquipmentGuideDeviceView
          key={`${device.id}-${task.id}-${initialChapterId ?? 'start'}-s${openSession}`}
          device={device}
          manualNumber={1}
          initialChapterId={initialChapterId}
          onBack={onCloseManual}
          onActionHotspot={handleActionHotspot}
        />
      </div>
    </div>
  );
}

function DesignGuideBody({
  task,
  onCloseManual,
  deepDocId,
  onClearDeepDoc,
  openSession,
}: {
  task: OperationalGuideTask;
  onCloseManual: () => void;
  deepDocId: string | null;
  onClearDeepDoc: () => void;
  openSession: number;
}) {
  const device = useMemo(() => getDesignGuideDevice(task.id), [task.id]);
  const defaultChapterId = useMemo(() => getDesignGuideStartChapterId(task.id), [task.id]);
  const label = OPERATIONAL_GUIDE_LABELS[task.id];
  const { syncDocToUrl, chapterParam } = useGuideDeepLink(task.id);
  const [openDoc, setOpenDoc] = useState<OpenDocState | null>(null);
  const initialChapterId = chapterParam || defaultChapterId;

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

  const handleActionHotspot = (
    spot: EquipmentManualPageActionHotspot,
    ctx?: { chapterId: string; pageId?: string },
  ) => {
    if (spot.linkedDocId) {
      const resolved = resolveFieldGuideLinkedDoc(spot.linkedDocId, task.id);
      if (resolved?.url) {
        syncDocToUrl(resolved.id, 'design', {
          chapterId: ctx?.chapterId,
          pageId: ctx?.pageId,
        });
        openDocPanel(setOpenDoc, {
          url: resolved.url,
          fileName: resolved.fileName,
          title: resolved.title,
          eyebrow: resolved.eyebrow,
        });
        return;
      }
    }
    if (spot.docUrl && spot.docFileName) {
      openDocPanel(setOpenDoc, {
        url: spot.docUrl,
        fileName: spot.docFileName,
        title: spot.label,
        eyebrow: `Document proiectare · ${label}`,
      });
    }
  };

  return (
    <div className="space-y-2">
      {openDoc ? (
        <FieldGuideDocOverlay
          placement="panel"
          pdfUrl={openDoc.url}
          pdfFileName={openDoc.fileName}
          title={openDoc.title}
          eyebrow={openDoc.eyebrow}
          returnLabel="Închide"
          contextHint={`Extindere deasupra manualului ghid — Ghid proiectare (${label}). Meniul de sus rămâne vizibil.`}
          onClose={closeDoc}
        />
      ) : null}
      <div className={openDoc ? 'opacity-45 pointer-events-none select-none' : undefined} aria-hidden={openDoc ? true : undefined}>
        <EquipmentGuideDeviceView
          key={`${device.id}-${task.id}-${initialChapterId ?? 'start'}-s${openSession}`}
          device={device}
          manualNumber={2}
          initialChapterId={initialChapterId}
          onBack={onCloseManual}
          onActionHotspot={handleActionHotspot}
        />
      </div>
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
  /** Forțează remount pe Cuprins la fiecare deschidere / schimbare Măsurare↔Proiectare */
  const [openSession, setOpenSession] = useState(0);

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

  /** Închide ghidul și uită capitolul — la redeschidere e mereu Cuprins. */
  const closeGuide = () => {
    setActive(null);
    const params = new URLSearchParams(searchParams);
    params.delete('ghid');
    params.delete('doc');
    params.delete('ch');
    params.delete('page');
    params.set('tip', task.id);
    params.set('ref', 'guide');
    setSearchParams(params, { replace: true });
  };

  const toggle = (id: ActiveGuide) => {
    const next = active === id ? null : id;
    const params = new URLSearchParams(searchParams);
    if (next === 'measurer') params.set('ghid', 'teren');
    else if (next === 'design') params.set('ghid', 'proiectare');
    else params.delete('ghid');
    // La închidere / redeschidere / schimbare Măsurare↔Proiectare: mereu Cuprins
    params.delete('ch');
    params.delete('page');
    if (!next || active !== next) params.delete('doc');
    params.set('tip', task.id);
    params.set('ref', 'guide');
    setSearchParams(params, { replace: true });
    setActive(next);
    if (next) setOpenSession((n) => n + 1);
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
            onCloseManual={closeGuide}
            deepDocId={active === 'measurer' ? docParam : null}
            onClearDeepDoc={clearDeepDoc}
            openSession={openSession}
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
            onCloseManual={closeGuide}
            deepDocId={active === 'design' ? docParam : null}
            onClearDeepDoc={clearDeepDoc}
            openSession={openSession}
          />
        ),
      },
    ],
    // toggle/clearDeepDoc are stable enough for this UI; params drive deep-link reopen
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, label, task, docParam, openSession],
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
