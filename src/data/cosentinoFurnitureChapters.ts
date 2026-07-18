import type { EquipmentChapter, EquipmentManualPage } from '@/data/equipmentOperations';

const FURNITURE_MANUAL_PDF = '/docs/repository/cosentino-furniture/furniture-design-installation.pdf';
const PAGE = (n: number) =>
  `/docs/repository/cosentino-furniture/pages/page-${String(n).padStart(2, '0')}.png`;

function manualPage(pageNum: number): EquipmentManualPage {
  return {
    id: `cosentino-furniture-p${pageNum}`,
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
    id: `cosentino-furniture-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages: pageNums.map((p) => manualPage(p)),
    images: [],
    pdfUrl: options?.includePdf ? FURNITURE_MANUAL_PDF : undefined,
    pdfFileName: options?.includePdf
      ? 'Cosentino-Spaces-Mobilier-Design-Instalare.pdf'
      : undefined,
  };
}

/** Mobilier Cosentino® Spaces — 16 pagini, fără videoclipuri. */
export const COSENTINO_FURNITURE_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Documentație completă', 'Descărcare document PDF — utilizare offline', [], { includePdf: true }),
  chapter(2, 'Prezentare & index', 'Structură document — proiectare și instalare mobilier', [1, 2]),
  chapter(3, 'Produse și grosimi', 'Dekton®, Silestone® — grosimi recomandate per aplicație', [3, 4]),
  chapter(4, 'Structuri auxiliare', 'Mobilier cu structură din lemn și recomandări tehnice', [5]),
  chapter(5, 'Recomandări mese', 'Formate mese rotunde, pătrate și dimensiuni admise', [6]),
  chapter(6, 'Margini protejate', 'Protecție muchii și detalii constructive', [7]),
  chapter(7, 'Console mobilier', 'Configurații masă pătrată, console și dimensiuni', [8]),
  chapter(8, 'Blat orizontal lipit', 'Soluții orizontale — grosimi și limite span', [9]),
  chapter(9, 'Blat vertical lipit', 'Soluții verticale — lipire pe toată lățimea', [10]),
  chapter(10, 'Instrumente și produse', 'Unelte și adezivi recomandate de producător', [11]),
  chapter(11, 'Inserții de ancorare', 'Distanțe și tipuri de ancorare recomandate', [12]),
  chapter(12, 'Tipuri de ambalare', 'Ambalaj primar, special și cerințe transport', [13, 14]),
  chapter(13, 'Sănătate și siguranță', 'Echipament protecție obligatoriu la montaj', [15]),
  chapter(14, 'Date producător', 'Contact Cosentino, certificări și revizie document', [16]),
];

export const COSENTINO_FURNITURE_MANUAL_URL = FURNITURE_MANUAL_PDF;
