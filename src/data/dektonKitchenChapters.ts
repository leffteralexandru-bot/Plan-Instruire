import type { EquipmentChapter, EquipmentManualPage } from '@/data/equipmentOperations';

const DEKTON_KITCHEN_PDF = '/docs/repository/dekton-kitchen/dekton-kitchen-countertops-manual.pdf';
const PAGE = (n: number) =>
  `/docs/repository/dekton-kitchen/pages/page-${String(n).padStart(2, '0')}.png`;

function manualPage(pageNum: number): EquipmentManualPage {
  return {
    id: `dekton-kitchen-p${pageNum}`,
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
    id: `dekton-kitchen-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages: pageNums.map((p) => manualPage(p)),
    images: [],
    pdfUrl: options?.includePdf ? DEKTON_KITCHEN_PDF : undefined,
    pdfFileName: options?.includePdf
      ? 'Dekton-Kitchen-Countertops-Design-Installation.pdf'
      : undefined,
  };
}

/** Manual Dekton® bucătărie — 14 pagini, fără videoclipuri. */
export const DEKTON_KITCHEN_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Documentație completă', 'Descărcare document PDF — utilizare offline', [], { includePdf: true }),
  chapter(2, 'Introducere', 'Prezentare cerințe — proiectare și instalare blaturi Dekton®', [1]),
  chapter(3, 'Prezentare generală', 'Familii I–IV, XGloss, Grip+ — structură document', [2, 3]),
  chapter(4, 'Grosimi și formate', 'Grosimi disponibile, formate masă și toleranțe', [4, 5]),
  chapter(5, 'Criterii proiectare', 'Front Dekton®, instalare chiuvetă și distanțe admise', [6]),
  chapter(6, 'Console insule', 'Console fără decupaje și cu decupaje/găuri', [7, 8]),
  chapter(7, 'Cascade laterale', 'Cascadă laterală și consolă combinată', [9]),
  chapter(8, 'Criterii instalare', 'Margine dreaptă, dimensiuni limită, tăiere pe model', [10]),
  chapter(9, 'Suport și fixare', 'Cerințe structurale dulap și susținere blat', [11]),
  chapter(10, 'Procedură instalare', 'Pași înainte de montaj și recomandări operative', [12]),
  chapter(11, 'Sănătate și siguranță', 'Norme de protecție pentru operatori și montatori', [13]),
  chapter(12, 'Date producător', 'Contact Cosentino, certificări și revizie document', [14]),
];

export const DEKTON_KITCHEN_MANUAL_URL = DEKTON_KITCHEN_PDF;
