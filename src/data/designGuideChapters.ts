import type {
  EquipmentChapter,
  EquipmentDevice,
  EquipmentManualPage,
  EquipmentManualPageActionHotspot,
} from '@/data/equipmentOperations';
import type { OperationalGuideTaskId } from '@/data/operationalGuide';
import { OPERATIONAL_GUIDE_LABELS } from '@/data/operationalGuide';
import {
  FIELD_GUIDE_ANEXA1_PDF,
  FIELD_GUIDE_ANEXA1_PDF_NAME,
  FIELD_GUIDE_CANTING_PDF,
  FIELD_GUIDE_CANTING_PDF_NAME,
  FIELD_GUIDE_CTG_PDF,
  FIELD_GUIDE_CTG_PDF_NAME,
  FIELD_GUIDE_FISE_TEHNICE_PDF,
  FIELD_GUIDE_FISE_TEHNICE_PDF_NAME,
} from '@/data/fieldGuideChapters';

/**
 * Ghid proiectare CAD — pe tip (etape comune + puncte extra tip).
 * Etapa 1.1–1.4 sunt pe o singură pagină compactă (pagina 2).
 */
const BY_TYPE_BASE = '/docs/operational-guide/design-guide/by-type';

export function getDesignGuideManualPdf(taskId: OperationalGuideTaskId): string {
  return `${BY_TYPE_BASE}/${taskId}/Ghid-proiectare-cad.pdf`;
}

export function getDesignGuideDownload(taskId: OperationalGuideTaskId): {
  url: string;
  fileName: string;
} {
  return {
    url: getDesignGuideManualPdf(taskId),
    fileName: `Ghid-proiectare-${taskId}.pdf`,
  };
}

function pageForType(taskId: OperationalGuideTaskId, n: number): string {
  return `${BY_TYPE_BASE}/${taskId}/pages/page-${String(n).padStart(2, '0')}.png`;
}

/** Hotspot-uri Etapa 1 — toate pe pagina 2 (compact). */
const HOTSPOT_ANEXA: EquipmentManualPageActionHotspot = {
  x: 7.14,
  y: 24.66,
  w: 18,
  h: 1.8,
  label: 'Anexa 1 (șablon)',
  linkedDocId: 'anexa1',
  docUrl: FIELD_GUIDE_ANEXA1_PDF,
  docFileName: FIELD_GUIDE_ANEXA1_PDF_NAME,
  hitOnly: true,
};

const HOTSPOT_FISE: EquipmentManualPageActionHotspot = {
  x: 7.14,
  y: 40.81,
  w: 32,
  h: 1.8,
  label: 'Fișe tehnice accesorii (exemple)',
  linkedDocId: 'fise',
  docUrl: FIELD_GUIDE_FISE_TEHNICE_PDF,
  docFileName: FIELD_GUIDE_FISE_TEHNICE_PDF_NAME,
  hitOnly: true,
};

const HOTSPOT_CANTING: EquipmentManualPageActionHotspot = {
  x: 7.14,
  y: 60.0,
  w: 12,
  h: 1.8,
  label: 'Canting',
  linkedDocId: 'canting',
  docUrl: FIELD_GUIDE_CANTING_PDF,
  docFileName: FIELD_GUIDE_CANTING_PDF_NAME,
  hitOnly: true,
};

const HOTSPOT_CTG: EquipmentManualPageActionHotspot = {
  x: 7.14,
  y: 78.82,
  w: 31,
  h: 1.8,
  label: 'CTG — Exemplu_Comanda_Material',
  linkedDocId: 'ctg',
  docUrl: FIELD_GUIDE_CTG_PDF,
  docFileName: FIELD_GUIDE_CTG_PDF_NAME,
  hitOnly: true,
};

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
  const download = getDesignGuideDownload(taskId);
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

/** Capitole comune CAD + puncte tip (ultima pagină). Numerotare pagini după compact Etapa 1. */
function buildDesignDevice(taskId: OperationalGuideTaskId): EquipmentDevice {
  const prefix = `design-${taskId}`;
  const label = OPERATIONAL_GUIDE_LABELS[taskId];

  const chapters: EquipmentChapter[] = [
    chapter(taskId, prefix, 1, 'Documentație completă', 'Deschide · descarcă · trimite — ghid proiectare pe tip', [], {
      includePdf: true,
    }),
    chapter(taskId, prefix, 2, 'Cuprins — etape CAD', 'Resurse · import · schiță · legendă · Bitrix', [1]),
    chapter(
      taskId,
      prefix,
      3,
      'Etapa 1 — Resurse de start',
      '1.1 Anexa · 1.2 Fișe · 1.3 Canting · 1.4 Comandă transfer',
      [2],
      {
        pageExtras: {
          2: {
            actionHotspots: [HOTSPOT_ANEXA, HOTSPOT_FISE, HOTSPOT_CANTING, HOTSPOT_CTG],
          },
        },
      },
    ),
    chapter(taskId, prefix, 4, 'Etapa 2.1 — Fișier Proliner', 'Ce trebuie să conțină măsurarea importată', [3]),
    chapter(taskId, prefix, 5, 'Etapa 2.2 — Segment de reper', 'Copie + proiectare pe reper', [4]),
    chapter(taskId, prefix, 6, 'Etapa 2.3 — Verificare suprapunere', 'Suprapunere + fișă tehnică material', [5]),
    chapter(taskId, prefix, 7, 'Etapa 2.4 — DXF producție', 'Conținutul fișierului pentru utilaj', [6]),
    chapter(taskId, prefix, 8, 'Etapa 2.5 — DXF reguli utilaj', 'Înainte de salvare', [7]),
    chapter(taskId, prefix, 9, 'Etapa 3.1 — Ansamblu', 'Pagina 1 — cote maxime', [8]),
    chapter(taskId, prefix, 10, 'Etapa 3.2 — Fișă tehnică', 'Pagina 2 — doar dacă e cazul', [9]),
    chapter(taskId, prefix, 11, 'Etapa 3.3 — Cotare', 'Regula 1 pe pagini detaliu', [10]),
    chapter(taskId, prefix, 12, 'Etapa 3.4 — Etichetare piese', 'Regula 2', [11]),
    chapter(taskId, prefix, 13, 'Etapa 3.5 — Simboluri debit', 'Debit / 45° / polișare', [12]),
    chapter(taskId, prefix, 14, 'Etapa 3.6 — Bizot / plintă', 'Regula 5', [13]),
    chapter(taskId, prefix, 15, 'Etapa 3.7 — Analiză montaj', '3 pași înainte — regula 6', [14]),
    chapter(taskId, prefix, 16, 'Etapa 4.1 — Legendă', 'Legendă pe fiecare pagină', [15]),
    chapter(taskId, prefix, 17, 'Etapa 4.2 — ID + Livrare', 'ID proiect + container Livrare', [16]),
    chapter(taskId, prefix, 18, 'Etapa 5 — Poză + fișe', 'De ce le atașezi tu (proiectant)', [17]),
    chapter(taskId, prefix, 19, 'Etapa 6 — Bitrix / Drive / local', 'Încărcare + mapă an/lună + modificări', [18]),
    chapter(
      taskId,
      prefix,
      20,
      `Puncte extra — ${label}`,
      'Doar pentru tipul selectat (după etapele comune)',
      [19],
    ),
  ];

  return {
    id: `design-guide-${taskId}`,
    name: `Ghid proiectare — ${label}`,
    category: 'Proiectare CAD',
    description:
      'Ghid proiectare CAD detaliat: resurse de start, import, schiță, legendă, predare Bitrix + puncte pe tip.',
    chapters,
    manualPdfUrl: getDesignGuideManualPdf(taskId),
    curatare: { text: '', steps: [], attachments: [] },
    utilizare: { text: '', steps: [], attachments: [] },
    cad: { text: '', steps: [], attachments: [] },
  };
}

export const DESIGN_GUIDE_DEVICES: Record<OperationalGuideTaskId, EquipmentDevice> = {
  blat: buildDesignDevice('blat'),
  scara: buildDesignDevice('scara'),
  placare: buildDesignDevice('placare'),
  semineu: buildDesignDevice('semineu'),
  scara_exterior: buildDesignDevice('scara_exterior'),
  glaf: buildDesignDevice('glaf'),
  placare_exterior: buildDesignDevice('placare_exterior'),
};

export function getDesignGuideDevice(taskId: OperationalGuideTaskId): EquipmentDevice {
  return DESIGN_GUIDE_DEVICES[taskId];
}

/** Primul capitol util (după Documentație / cuprins) — Etapa 1 compact. */
export function getDesignGuideStartChapterId(taskId: OperationalGuideTaskId): string {
  return `design-${taskId}-ch-3`;
}
