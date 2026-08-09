import type {
  EquipmentChapter,
  EquipmentDevice,
  EquipmentManualPage,
  EquipmentManualPageActionHotspot,
} from '@/data/equipmentOperations';
import type { OperationalGuideTaskId } from '@/data/operationalGuide';
import { OPERATIONAL_GUIDE_LABELS } from '@/data/operationalGuide';

/**
 * Ghid teren — pe site: pagini pe tip (by-type/).
 * Descărcare Documentație completă: PDF general (toate tipurile), un singur fișier.
 */
export const FIELD_GUIDE_MANUAL_PDF = '/docs/operational-guide/field-guide/Ghid-teren-masurare.pdf';
export const FIELD_GUIDE_MANUAL_PDF_NAME = 'Ghid-teren-masurare.pdf';
/** @deprecated — master ZIP (toate tipurile + linked-manuals). */
export const FIELD_GUIDE_DOWNLOAD_URL =
  '/docs/operational-guide/field-guide/Ghid-teren-masurare-cu-manuale.zip';
export const FIELD_GUIDE_DOWNLOAD_NAME = 'Ghid-teren-masurare-cu-manuale.zip';

const FIELD_GUIDE_BY_TYPE_BASE = '/docs/operational-guide/field-guide/by-type';

/** PDF pe tip — doar referință / regenerare; pe site se citesc paginile PNG pe tip. */
export function getFieldGuideManualPdf(taskId: OperationalGuideTaskId): string {
  return `${FIELD_GUIDE_BY_TYPE_BASE}/${taskId}/Ghid-teren-masurare.pdf`;
}

/** Descărcare / previzualizare Documentație completă — același PDF general pentru orice tip. */
export function getFieldGuideDownload(_taskId?: OperationalGuideTaskId): {
  url: string;
  fileName: string;
} {
  return {
    url: FIELD_GUIDE_MANUAL_PDF,
    fileName: FIELD_GUIDE_MANUAL_PDF_NAME,
  };
}

function pageForType(taskId: OperationalGuideTaskId, n: number): string {
  return `${FIELD_GUIDE_BY_TYPE_BASE}/${taskId}/pages/page-${String(n).padStart(2, '0')}.png`;
}

/** Șablon Anexa 1 — din Desktop „Anexa 1 Sablon.pdf”. */
export const FIELD_GUIDE_ANEXA1_PDF =
  '/docs/operational-guide/field-guide/linked-manuals/anexa-1-sablon.pdf';
export const FIELD_GUIDE_ANEXA1_PDF_NAME = 'Anexa-1-Sablon.pdf';

/**
 * Șablon Canting — din Desktop „Cating.pdf” (ortografie greșită pe fișier).
 * În ghid / UI folosim forma corectă: Canting.
 */
export const FIELD_GUIDE_CANTING_PDF =
  '/docs/operational-guide/field-guide/linked-manuals/Canting.pdf';
export const FIELD_GUIDE_CANTING_PDF_NAME = 'Canting.pdf';

/**
 * Șablon CTG — Comandă material (Comandă transfer între gestiuni).
 * Din Desktop „Exemplu_Comanda_Material.pdf”. CTG = denumirea din ghid (corectă).
 */
export const FIELD_GUIDE_CTG_PDF =
  '/docs/operational-guide/field-guide/linked-manuals/Exemplu_Comanda_Material.pdf';
export const FIELD_GUIDE_CTG_PDF_NAME = 'Exemplu_Comanda_Material.pdf';

/**
 * Exemple fișe tehnice accesorii (chiuvetă / baterie / plită) — Etapa 1.7.
 * Imagini din spec sheets publice (Franke / Hansgrohe / Bosch); pe teren = fișa reală.
 */
export const FIELD_GUIDE_FISE_TEHNICE_PDF =
  '/docs/operational-guide/field-guide/linked-manuals/Exemple_Fise_Tehnice_Accesorii.pdf';
export const FIELD_GUIDE_FISE_TEHNICE_PDF_NAME = 'Exemple_Fise_Tehnice_Accesorii.pdf';

/** Carnet măsurători + creion — exemplu vizual (Etapa 1.1). */
export const FIELD_GUIDE_CARNET_PDF =
  '/docs/operational-guide/field-guide/linked-manuals/Carnet-masuratori-creion.pdf';
export const FIELD_GUIDE_CARNET_PDF_NAME = 'Carnet-masuratori-creion.pdf';

const CHECKLIST_BASE = '/docs/operational-guide/checklists';

/** Checklist Client ArtGranit — câte un PDF per tip de măsurare. */
export const FIELD_GUIDE_CHECKLIST_BY_TASK: Record<
  OperationalGuideTaskId,
  { url: string; fileName: string }
> = {
  blat: {
    url: `${CHECKLIST_BASE}/Checklist_Client_ArtGranit-Blat.pdf`,
    fileName: 'Checklist_Client_ArtGranit-Blat.pdf',
  },
  scara: {
    url: `${CHECKLIST_BASE}/Checklist_Client_ArtGranit-Scara.pdf`,
    fileName: 'Checklist_Client_ArtGranit-Scara.pdf',
  },
  placare: {
    url: `${CHECKLIST_BASE}/Checklist_Client_ArtGranit-Placare.pdf`,
    fileName: 'Checklist_Client_ArtGranit-Placare.pdf',
  },
  semineu: {
    url: `${CHECKLIST_BASE}/Checklist_Client_ArtGranit-Semineu.pdf`,
    fileName: 'Checklist_Client_ArtGranit-Semineu.pdf',
  },
  scara_exterior: {
    url: `${CHECKLIST_BASE}/Checklist_Client_ArtGranit-Scari-exterioare.pdf`,
    fileName: 'Checklist_Client_ArtGranit-Scari-exterioare.pdf',
  },
  glaf: {
    url: `${CHECKLIST_BASE}/Checklist_Client_ArtGranit-Glaf.pdf`,
    fileName: 'Checklist_Client_ArtGranit-Glaf.pdf',
  },
  placare_exterior: {
    url: `${CHECKLIST_BASE}/Checklist_Client_ArtGranit-Placari-exterioare.pdf`,
    fileName: 'Checklist_Client_ArtGranit-Placari-exterioare.pdf',
  },
};

/**
 * Zone click pe Etapa 1.1 (echipament) — textul e deja albastru+link în PDF/PNG.
 * docUrl = același fișier ca hyperlink-ul din PDF-ul descărcat.
 */
export const FIELD_GUIDE_EQUIPMENT_ACTION_HOTSPOTS: EquipmentManualPageActionHotspot[] = [
  {
    x: 8.0,
    y: 14.42,
    w: 32,
    h: 1.35,
    label: 'ANEXA Nr. 1 (șablon)',
    linkedDocId: 'anexa1',
    docUrl: FIELD_GUIDE_ANEXA1_PDF,
    docFileName: FIELD_GUIDE_ANEXA1_PDF_NAME,
    hitOnly: true,
  },
  {
    x: 8.0,
    y: 16.08,
    w: 28,
    h: 1.35,
    label: 'Carnet măsurători + creion',
    linkedDocId: 'carnet',
    docUrl: FIELD_GUIDE_CARNET_PDF,
    docFileName: FIELD_GUIDE_CARNET_PDF_NAME,
    hitOnly: true,
  },
  {
    x: 8.0,
    y: 17.75,
    w: 28,
    h: 1.35,
    label: 'Aparatul de măsurat Proliner',
    linkedDocId: 'proliner',
    deviceId: 'eq-proliner',
    docUrl: '/docs/operational-guide/field-guide/linked-manuals/proliner-manual.pdf',
    docFileName: 'proliner-manual.pdf',
    hitOnly: true,
  },
  {
    x: 8.0,
    y: 19.41,
    w: 30,
    h: 1.35,
    label: 'Nivelă laser Bosch GLL 3-80',
    linkedDocId: 'gll',
    deviceId: 'eq-bosch-gll-3-80',
    docUrl: '/docs/operational-guide/field-guide/linked-manuals/bosch-gll-3-80-manual.pdf',
    docFileName: 'bosch-gll-3-80-manual.pdf',
    hitOnly: true,
  },
  {
    x: 8.0,
    y: 21.07,
    w: 20.5,
    h: 1.35,
    label: 'Ruletă Bosch 5 m',
    linkedDocId: 'ruleta',
    deviceId: 'eq-bosch-tape-5m',
    docUrl: '/docs/operational-guide/field-guide/linked-manuals/bosch-ruleta-5m.pdf',
    docFileName: 'bosch-ruleta-5m.pdf',
    hitOnly: true,
  },
];

/** Etapa 1.3 — buton Checklist_Client_ArtGranit (șablon pe tip). */
export function fieldGuideChecklistHotspot(
  taskId: OperationalGuideTaskId,
): EquipmentManualPageActionHotspot {
  const doc = FIELD_GUIDE_CHECKLIST_BY_TASK[taskId];
  return {
    // Etapa 1.3 — buton Checklist_Client_ArtGranit din PDF
    x: 7.1,
    y: 56.94,
    w: 28,
    h: 1.55,
    label: 'Checklist_Client_ArtGranit',
    linkedDocId: 'checklist',
    docUrl: doc.url,
    docFileName: doc.fileName,
    hitOnly: true,
  };
}

/** Etapa 1.4 — același șablon Anexa 1. */
export const FIELD_GUIDE_ANEXA14_HOTSPOT: EquipmentManualPageActionHotspot = {
  x: 7.1,
  y: 73.1,
  w: 22,
  h: 1.55,
  label: 'Anexa 1 (șablon)',
  linkedDocId: 'anexa1',
  docUrl: FIELD_GUIDE_ANEXA1_PDF,
  docFileName: FIELD_GUIDE_ANEXA1_PDF_NAME,
  hitOnly: true,
};

/** Etapa 1.5 — buton Canting (șablon exemplu nesting). */
export const FIELD_GUIDE_CANTING_HOTSPOT: EquipmentManualPageActionHotspot = {
  x: 7.1,
  y: 24.16,
  w: 14,
  h: 1.55,
  label: 'Canting',
  linkedDocId: 'canting',
  docUrl: FIELD_GUIDE_CANTING_PDF,
  docFileName: FIELD_GUIDE_CANTING_PDF_NAME,
  hitOnly: true,
};

/** Etapa 1.5 — exemple fișe tehnice accesorii (lângă Canting). */
export const FIELD_GUIDE_FISE_TEHNICE_HOTSPOT: EquipmentManualPageActionHotspot = {
  x: 7.1,
  y: 26.06,
  w: 32,
  h: 1.55,
  label: 'Fișe tehnice accesorii (exemple)',
  linkedDocId: 'fise',
  docUrl: FIELD_GUIDE_FISE_TEHNICE_PDF,
  docFileName: FIELD_GUIDE_FISE_TEHNICE_PDF_NAME,
  hitOnly: true,
};

/** Etapa 1.6 — buton CTG / Exemplu_Comanda_Material. */
export const FIELD_GUIDE_CTG_HOTSPOT: EquipmentManualPageActionHotspot = {
  x: 7.1,
  y: 42.21,
  w: 34,
  h: 1.55,
  label: 'CTG — Exemplu_Comanda_Material',
  linkedDocId: 'ctg',
  docUrl: FIELD_GUIDE_CTG_PDF,
  docFileName: FIELD_GUIDE_CTG_PDF_NAME,
  hitOnly: true,
};

/** Etapa 1.7 — Documentație tehnică (Repository pe panou). */
export const FIELD_GUIDE_DOC_TEHNICA_HOTSPOT: EquipmentManualPageActionHotspot = {
  x: 7.1,
  y: 52.74,
  w: 86,
  h: 3.4,
  label: 'Documentație tehnică',
  linkedDocId: 'doc-tehnica',
  href: '/ingineri/panou-angajat?ref=repo&doc=doc-tehnica',
  hitOnly: true,
};

function page2Hotspots(taskId: OperationalGuideTaskId): EquipmentManualPageActionHotspot[] {
  return [
    ...FIELD_GUIDE_EQUIPMENT_ACTION_HOTSPOTS,
    fieldGuideChecklistHotspot(taskId),
    FIELD_GUIDE_ANEXA14_HOTSPOT,
  ];
}

function page3Hotspots(): EquipmentManualPageActionHotspot[] {
  return [
    FIELD_GUIDE_CANTING_HOTSPOT,
    FIELD_GUIDE_FISE_TEHNICE_HOTSPOT,
    FIELD_GUIDE_CTG_HOTSPOT,
    FIELD_GUIDE_DOC_TEHNICA_HOTSPOT,
  ];
}

function manualPage(
  taskId: OperationalGuideTaskId,
  pageNum: number,
  prefix: string,
  extras?: Partial<EquipmentManualPage>,
): EquipmentManualPage {
  return {
    id: `${prefix}-p${pageNum}`,
    imageUrl: pageForType(taskId, pageNum),
    ...extras,
  };
}

function chapter(
  taskId: OperationalGuideTaskId,
  prefix: string,
  number: number,
  title: string,
  summary: string,
  pageNums: number[],
  options?: { includePdf?: boolean; pageExtras?: Record<number, Partial<EquipmentManualPage>> },
): EquipmentChapter {
  const download = getFieldGuideDownload(taskId);
  return {
    id: `${prefix}-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages: pageNums.map((p) => manualPage(taskId, p, prefix, options?.pageExtras?.[p])),
    images: [],
    pdfUrl: options?.includePdf ? download.url : undefined,
    pdfFileName: options?.includePdf ? download.fileName : undefined,
  };
}

/** Capitole comune — Etapa 1 + Etapa 2 (pentru TOATE tipurile). */
function buildCommonChapters(prefix: string, taskId: OperationalGuideTaskId): EquipmentChapter[] {
  return [
    chapter(
      taskId,
      prefix,
      1,
      'Documentație completă',
      'Deschide · descarcă · trimite — ghid general (toate tipurile de măsurare)',
      [],
      { includePdf: true },
    ),
    chapter(
      taskId,
      prefix,
      2,
      'Cuprins — etape',
      'Etapa 1–2 comune · Blat · Scări · Placare · Cămin · Ext. · Glaf — toate tipurile',
      [1],
    ),
    chapter(
      taskId,
      prefix,
      3,
      'Etapa 1 — Pregătire I',
      '1.1 Echipament · 1.2 Programare · 1.3 Checklist_Client_ArtGranit · 1.4 Anexa 1 (șablon)',
      [2],
      {
        pageExtras: {
          2: { actionHotspots: page2Hotspots(taskId) },
        },
      },
    ),
    chapter(
      taskId,
      prefix,
      4,
      'Etapa 1 — Pregătire II / Full Kit',
      '1.5 Canting · 1.6 CTG · 1.7 Fișă tehnică · 1.8 Full Kit',
      [3],
      {
        pageExtras: {
          3: { actionHotspots: page3Hotspots() },
        },
      },
    ),
    chapter(
      taskId,
      prefix,
      5,
      'Etapa 2 — Reguli generale',
      '2.1 Cotă/voce · 2.2 Unghiuri · 2.3 FAȚĂ VĂZUTĂ · 2.4 Proliner',
      [4],
    ),
  ];
}

interface TypeGuideSpec {
  id: OperationalGuideTaskId;
  subtitle: string;
  /** Capitole doar pentru acest tip (după comune). Numerotare = pagini în PDF-ul by-type. */
  typeChapters: Array<{ title: string; summary: string; pages: number[] }>;
}

/**
 * PDF by-type: pagini 1–4 comune; de la 5 = doar tipul.
 * Blat: 5–8 · celelalte tipuri: o singură pagină (5).
 */
const TYPE_SPECS: TypeGuideSpec[] = [
  {
    id: 'blat',
    subtitle: 'Tip măsurare BLAT — Etapa 3.1–3.5 (doar Blat)',
    typeChapters: [
      {
        title: 'Etapa 3.1 — Blat · condiții',
        summary: 'DOAR tip Blat — condiții obligatorii înainte de măsurare',
        pages: [5],
      },
      {
        title: 'Etapa 3.2 — Blat · întrebări pe loc',
        summary: '8 întrebări care elimină ~99% din erori — doar pentru Blat',
        pages: [6],
      },
      {
        title: 'Etapa 3.3 — Blat · reguli tip',
        summary: 'Dilatare, 2 mm, goluri, aliniere — șorțul = placare (nu aici)',
        pages: [7],
      },
      {
        title: 'Etapa 3.4–3.5 — Blat · pași & reverificare',
        summary: '16 pași pe teren + set complet înainte de plecare',
        pages: [8],
      },
    ],
  },
  {
    id: 'scara',
    subtitle: 'Tip măsurare SCĂRI — doar acest tip',
    typeChapters: [
      {
        title: 'Etapa 3 — Scări',
        summary: 'Obligații pe loc + reguli: tip trepte, LED/plintă, Proliner, Bitrix',
        pages: [5],
      },
    ],
  },
  {
    id: 'placare',
    subtitle: 'Tip măsurare PLACARE / ȘORȚ — doar acest tip',
    typeChapters: [
      {
        title: 'Etapa 3 — Placare perete',
        summary: 'Condiții + obligații pe loc + reguli laser/Proliner/canting',
        pages: [5],
      },
    ],
  },
  {
    id: 'semineu',
    subtitle: 'Tip măsurare PLACARE CĂMIN — doar acest tip',
    typeChapters: [
      {
        title: 'Etapa 3 — Placare cămin',
        summary: 'Condiții obligatorii: cămin, termo, grilă, proiect + Proliner',
        pages: [5],
      },
    ],
  },
  {
    id: 'scara_exterior',
    subtitle: 'Tip măsurare SCĂRI EXTERIOARE — doar acest tip',
    typeChapters: [
      {
        title: 'Etapa 3 — Scări exterioare',
        summary: 'Obligații pe loc + reguli: schele, meteo, picurător, Bitrix kit',
        pages: [5],
      },
    ],
  },
  {
    id: 'glaf',
    subtitle: 'Tip măsurare PERVAZURI / GLAFURI — doar acest tip',
    typeChapters: [
      {
        title: 'Etapa 3 — Pervazuri / glafuri',
        summary: 'Condiții obligatorii + reguli: pantă/picurător, F1…Fn pe toc',
        pages: [5],
      },
    ],
  },
  {
    id: 'placare_exterior',
    subtitle: 'Tip măsurare PLACĂRI EXTERIOARE — doar acest tip',
    typeChapters: [
      {
        title: 'Etapa 3 — Placări exterioare',
        summary: 'Reguli pe teren: prindere mecanică, laser, canting/CTG, livrare',
        pages: [5],
      },
    ],
  },
];

function buildTypeDevice(spec: TypeGuideSpec): EquipmentDevice {
  const prefix = `field-${spec.id}`;
  const label = OPERATIONAL_GUIDE_LABELS[spec.id];
  const common = buildCommonChapters(prefix, spec.id);
  const typeChapters = spec.typeChapters.map((ch, index) =>
    chapter(spec.id, prefix, common.length + index + 1, ch.title, ch.summary, ch.pages),
  );
  return {
    id: `field-guide-${spec.id}`,
    name: `Ghid teren — ${label}`,
    category: 'Măsurare teren',
    description: `${spec.subtitle}. Include Etapa 1–2 (comune) + doar fișa acestui tip.`,
    chapters: [...common, ...typeChapters],
    manualPdfUrl: getFieldGuideManualPdf(spec.id),
    curatare: { text: '', steps: [], attachments: [] },
    utilizare: { text: '', steps: [], attachments: [] },
    cad: { text: '', steps: [], attachments: [] },
  };
}

/** Câte un manual separat per tip — fără capitolele altor tipuri. */
export const FIELD_GUIDE_DEVICES: Record<OperationalGuideTaskId, EquipmentDevice> = Object.fromEntries(
  TYPE_SPECS.map((spec) => [spec.id, buildTypeDevice(spec)]),
) as Record<OperationalGuideTaskId, EquipmentDevice>;

export function getFieldGuideDevice(taskId: OperationalGuideTaskId): EquipmentDevice {
  return FIELD_GUIDE_DEVICES[taskId];
}

/** Capitol de start la (re)deschiderea ghidului măsurare — Cuprins. */
export function getFieldGuideStartChapterId(taskId: OperationalGuideTaskId): string {
  return `field-${taskId}-ch-2`;
}

/** @deprecated — folosește getFieldGuideDevice(taskId) */
export const FIELD_GUIDE_DEVICE = FIELD_GUIDE_DEVICES.blat;

/** @deprecated */
export const FIELD_GUIDE_CHAPTERS = FIELD_GUIDE_DEVICES.blat.chapters ?? [];

/** @deprecated */
export const FIELD_GUIDE_CHAPTER_BY_TASK: Record<string, string> = Object.fromEntries(
  TYPE_SPECS.map((s) => [s.id, getFieldGuideStartChapterId(s.id)]),
);
