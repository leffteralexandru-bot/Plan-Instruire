import type { EquipmentChapter, EquipmentManualPage } from '@/data/equipmentOperations';

const INTEGRITY_GUIDE_PDF = '/docs/repository/silestone-sinks/integrity-guide.pdf';
const PAGE = (n: number) =>
  `/docs/repository/silestone-sinks/integrity-guide/pages/page-${String(n).padStart(2, '0')}.png`;

function manualPage(pageNum: number): EquipmentManualPage {
  return {
    id: `silestone-integrity-p${pageNum}`,
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
    id: `silestone-integrity-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages: pageNums.map((p) => manualPage(p)),
    images: [],
    pdfUrl: options?.includePdf ? INTEGRITY_GUIDE_PDF : undefined,
    pdfFileName: options?.includePdf ? 'INTEGRITY.pdf' : undefined,
  };
}

/** Chiuvete Silestone® Integrity — 9 pagini, ghiduri instalare producător. */
export const SILESTONE_INTEGRITY_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Documentație completă', 'Descărcare document PDF — utilizare offline', [], { includePdf: true }),
  chapter(2, 'Index ghiduri', 'Prezentare pachet instalare chiuvete Integrity', [1, 2]),
  chapter(
    3,
    'Undermount cu benzi',
    'Modele ONE, DUE, Q și instalare manuală cu benzi de fixare',
    [3, 4],
  ),
  chapter(4, 'Chiuvetă integrată', 'Instrucțiuni instalare chiuvetă integrată Silestone®', [5]),
  chapter(5, 'Undermount cu adeziv', 'Fixare chiuvetă sub blat cu adeziv pe blat', [6, 7]),
  chapter(6, 'Chiuvetă încorporată', 'Ghid instalare chiuvetă încorporată Silestone®', [8]),
  chapter(7, 'Date producător', 'Contact Cosentino și informații suport', [9]),
];

export const SILESTONE_INTEGRITY_GUIDE_URL = INTEGRITY_GUIDE_PDF;
