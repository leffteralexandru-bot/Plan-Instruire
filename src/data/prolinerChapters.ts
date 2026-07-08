import type { EquipmentChapter, EquipmentManualPage, EquipmentSafetyWarning } from '@/data/equipmentOperations';
import { PROLINER_PAGE_HOTSPOTS } from '@/data/prolinerPageHotspots';

const PROLINER_MANUAL_PDF = '/docs/equipment/proliner-quick-start-ro.pdf';
const PAGE = (n: number) => `/docs/equipment/proliner/pages/page-${String(n).padStart(2, '0')}.png`;

export const PROLINER_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță',
  content: `## Responsabilitate operator

Influența operatorului asupra procesului de măsurare este decisivă — operatorul este pe deplin responsabil pentru acuratețe și siguranță.

## Reguli critice

- **Nimeni nu are voie** să se apropie de cablu sau de cutia de comandă cât timp stiloul este în uz.
- Un cablu rupt sau un stilou scăpat poate provoca retragerea rapidă și imprevizibilă a cablului — risc grav de rănire.
- Efectuați măsurători de control periodic pentru a asigura precizia.
- Permiteți **numai personalului instruit** să lucreze cu Proliner.
- Nu utilizați Proliner în zone cu lucrări de construcție intense.`,
};

function manualPage(pageNum: number): EquipmentManualPage {
  const spot = PROLINER_PAGE_HOTSPOTS[pageNum];
  return {
    id: `proliner-p${pageNum}`,
    imageUrl: PAGE(pageNum),
    videoUrl: spot?.videoUrl,
    hotspot: spot ? { x: spot.x, y: spot.y, w: spot.w, h: spot.h } : undefined,
  };
}

function chapter(
  number: number,
  title: string,
  summary: string,
  pageNums: number[],
): EquipmentChapter {
  const pages = pageNums.map((p) => manualPage(p));
  const primaryVideo = pages.find((p) => p.videoUrl)?.videoUrl;
  return {
    id: `proliner-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages,
    videoUrl: primaryVideo,
    images: [],
    pdfUrl: PROLINER_MANUAL_PDF,
    pdfFileName: `Proliner-Capitol-${number}-${title.replace(/\s+/g, '-').slice(0, 40)}.pdf`,
  };
}

/** Doar paginile din manual — fără text duplicat; video la click pe play din desen. */
export const PROLINER_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Conținutul pachetului', 'Componente standard și verificare colet', [4]),
  chapter(2, 'Proliner (hardware)', 'Piese, butoane și montaj pe trepied', [5]),
  chapter(3, 'Telecomanda', 'Mod punct, continuu, închidere contur, ștergere', [6]),
  chapter(4, 'Software-ul Proliner', 'Autentificare, aplicații, meniuri și setări', [7, 8, 9]),
  chapter(5, 'Proiecție 2D', 'De la măsurare 3D la șablon 2D', [10]),
  chapter(6, 'Compensarea măsurătorilor', 'Corecție 2,5 mm vârf stilou', [11]),
  chapter(7, 'Poziționare', 'Stabilitate, rază de acțiune, înălțime', [12]),
  chapter(8, 'Funcția Leap', 'Rază nelimitată cu leap-pods', [13]),
  chapter(9, 'Măsurarea în 5 pași', 'Flux complet blat bucătărie', [14]),
  chapter(10, 'Proliner CT', 'Funcții CAD la fața locului', [15]),
  chapter(11, 'Întreținere', 'Curățare cablu și depozitare', [16]),
];

export const PROLINER_MANUAL_URL = PROLINER_MANUAL_PDF;
