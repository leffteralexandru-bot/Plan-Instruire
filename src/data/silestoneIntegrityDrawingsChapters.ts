import type { EquipmentChapter, EquipmentManualPage } from '@/data/equipmentOperations';

const INSTALL_DRAWINGS_PDF = '/docs/repository/silestone-sinks/install-drawings.pdf';
const PAGE = (n: number) =>
  `/docs/repository/silestone-sinks/install-drawings/pages/page-${String(n).padStart(2, '0')}.png`;

function manualPage(pageNum: number): EquipmentManualPage {
  return {
    id: `silestone-integrity-dwg-p${pageNum}`,
    imageUrl: PAGE(pageNum),
  };
}

function chapter(
  number: number,
  title: string,
  summary: string,
  pageNums: number[],
  options?: { includePdf?: boolean },
): EquipmentChapter {
  return {
    id: `silestone-integrity-dwg-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages: pageNums.map((p) => manualPage(p)),
    images: [],
    pdfUrl: options?.includePdf ? INSTALL_DRAWINGS_PDF : undefined,
    pdfFileName: options?.includePdf ? 'Silestone-Integrity-Chiuvete-Planse.pdf' : undefined,
  };
}

/** Planșe tehnice chiuvete Silestone® Integrity — 2 planșe vectoriale. */
export const SILESTONE_INTEGRITY_DRAWINGS_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Documentație completă', 'Descărcare planșe PDF — utilizare offline', [], { includePdf: true }),
  chapter(2, 'Planșa I', 'Specificații tehnice și decupaj — plansa 1', [1]),
  chapter(3, 'Planșa II', 'Specificații tehnice și decupaj — plansa 2', [2]),
];

export const SILESTONE_INTEGRITY_DRAWINGS_URL = INSTALL_DRAWINGS_PDF;
