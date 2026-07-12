import type { EquipmentChapter, EquipmentManualPage, EquipmentSafetyWarning } from '@/data/equipmentOperations';
import { FACTORY_FABRICATOR_PAGE_HOTSPOTS } from '@/data/factoryFabricatorPageHotspots';

const FACTORY_FABRICATOR_MANUAL_PDF = '/docs/equipment/factory-fabricator-manual-ro.pdf';
const PAGE = (n: number) => `/docs/equipment/factory-fabricator/pages/page-${String(n).padStart(2, '0')}.png`;

export const FACTORY_FABRICATOR_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță',
  content: `## Responsabilitate operator

Fabricator fabrică gestionează proiecte de producție — verificați setările bibliotecii și validarea măsurătorilor înainte de export.

## Reguli critice

- Configurați materialele, decupajele și profilele înainte de desen.
- Exportați proiectele Proliner (.prlp) doar după verificarea măsurătorilor.
- Permiteți **numai personalului instruit** accesul la modulele de producție și cotare.`,
};

function manualPage(pageNum: number): EquipmentManualPage {
  const spots = FACTORY_FABRICATOR_PAGE_HOTSPOTS[pageNum];
  const primaryVideo = spots?.[0]?.videoUrl;
  return {
    id: `factory-fabricator-p${pageNum}`,
    imageUrl: PAGE(pageNum),
    videoUrl: primaryVideo,
    videoHotspots: spots,
    hotspot: spots?.length === 1
      ? { x: spots[0].x, y: spots[0].y, w: spots[0].w, h: spots[0].h }
      : undefined,
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
  const primaryVideo = pages.find((p) => p.videoUrl)?.videoUrl;
  return {
    id: `factory-fabricator-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages,
    videoUrl: primaryVideo,
    images: [],
    pdfUrl: options?.includePdf ? FACTORY_FABRICATOR_MANUAL_PDF : undefined,
    pdfFileName: options?.includePdf
      ? 'Fabricator-fabrica-Manual-software-artGRANIT.pdf'
      : undefined,
  };
}

/** Capitol 1 = PDF complet. Capitolele 2–12 = pagini manual (fără copertă și cuprins). */
export const FACTORY_FABRICATOR_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Manual de instruire', 'Descărcare manual complet PDF — offline', [], { includePdf: true }),
  chapter(2, 'Introducere', 'Ghid rapid, module principale și configurări', [5, 6, 7]),
  chapter(3, 'Instalare și configurare', 'Instalare, câmpuri proiect și setări', [8, 9, 10, 11, 12, 13]),
  chapter(4, 'Configurare bibliotecă', 'Import, materiale, decupaje și profile', [14, 15, 16, 17, 18, 19, 20]),
  chapter(5, 'Modul proiect', 'Pagina proiect — fișiere și proiecte noi', [21, 22, 23]),
  chapter(6, 'Modul desen', 'Instrumente CAD, CT și comenzi avansate', [24, 25, 26, 27, 28, 29]),
  chapter(7, 'Modul potrivire', 'Layout tăiere și controale acțiune', [30, 31, 32, 33, 34]),
  chapter(8, 'Cotație și bibliotecă', 'Modul cotație și gestionare materiale', [35, 36, 37, 38, 39]),
  chapter(9, 'Creator plăci', 'Digitalizare plăci și inventar', [40, 41]),
  chapter(10, 'Proliner și Factory', 'Măsurători, export/import și editare CAD', [42, 43, 44, 45, 46]),
  chapter(11, 'Ghid proiect', 'Întrebări frecvente — pagina proiect', [47, 48, 49, 50]),
  chapter(12, 'Ghid bibliotecă', 'Întrebări frecvente — bibliotecă și profile', [51, 52, 53, 54, 55]),
];

export const FACTORY_FABRICATOR_MANUAL_URL = FACTORY_FABRICATOR_MANUAL_PDF;
