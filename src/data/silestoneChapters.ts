import type { EquipmentChapter, EquipmentManualPage } from '@/data/equipmentOperations';

const SILESTONE_MANUAL_PDF = '/docs/repository/silestone/silestone-countertops-manual.pdf';
const PAGE = (n: number) => `/docs/repository/silestone/pages/page-${String(n).padStart(2, '0')}.png`;

function manualPage(pageNum: number): EquipmentManualPage {
  return {
    id: `silestone-p${pageNum}`,
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
  const pages = pageNums.map((p) => manualPage(p));
  return {
    id: `silestone-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages,
    images: [],
    pdfUrl: options?.includePdf ? SILESTONE_MANUAL_PDF : undefined,
    pdfFileName: options?.includePdf
      ? 'Ghid-tehnic-Silestone-Proiectare-Instalare-Blaturi.pdf'
      : undefined,
  };
}

/** Manual Silestone — 14 pagini, fără videoclipuri. */
export const SILESTONE_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Documentație completă', 'Descărcare document PDF — utilizare offline', [], { includePdf: true }),
  chapter(2, 'Introducere', 'Prezentare cerințe — proiectare și instalare blaturi Silestone®', [1]),
  chapter(3, 'Prezentare generală', 'Structură document și prezentare material', [2, 3]),
  chapter(4, 'Toleranțe dimensionale', 'Grosimi standard, dimensiuni plăci și abateri admise', [4, 5]),
  chapter(5, 'Criterii de proiectare I', 'Reguli tehnice de proiectare și detalii constructive', [6, 7]),
  chapter(6, 'Criterii de proiectare II', 'Configurare blaturi, decupaje și îmbinări', [8, 9]),
  chapter(7, 'Blaturi de lucru', 'Specificații tehnice pentru blaturi de lucru', [10]),
  chapter(8, 'Suport și fixare', 'Cerințe structurale pentru dulap și susținerea blatului', [11]),
  chapter(9, 'Procedură de instalare', 'Etape de montaj și recomandări operative', [12]),
  chapter(10, 'Sănătate și siguranță', 'Norme de protecție pentru operatori și montatori', [13]),
  chapter(11, 'Date producător', 'Contact Cosentino, certificări și revizie document', [14]),
];

export const SILESTONE_MANUAL_URL = SILESTONE_MANUAL_PDF;
