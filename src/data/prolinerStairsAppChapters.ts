import type { EquipmentChapter, EquipmentManualPage, EquipmentSafetyWarning } from '@/data/equipmentOperations';
import { PROLINER_STAIRS_APP_PAGE_HOTSPOTS } from '@/data/prolinerStairsAppPageHotspots';

const PROLINER_STAIRS_APP_MANUAL_PDF = '/docs/equipment/proliner-stairs-app-manual-ro.pdf';
const PAGE = (n: number) =>
  `/docs/equipment/proliner-stairs-app/pages/page-${String(n).padStart(2, '0')}.png`;

export const PROLINER_STAIRS_APP_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță',
  content: `## Responsabilitate operator

Aplicația Proliner Stairs ghidează măsurarea scărilor — respectați secvența și verificați modelul înainte de raport.

## Reguli critice

- Configurați conturul, compensarea și proiecția înainte de măsurare.
- Verificați stabilitatea Proliner-ului și raza de acțiune a cablului.
- Consultați manualul Proliner 4.X pentru meniuri și ecrane generale.`,
};

function manualPage(pageNum: number): EquipmentManualPage {
  const spots = PROLINER_STAIRS_APP_PAGE_HOTSPOTS[pageNum];
  const primaryVideo = spots?.[0]?.videoUrl;
  return {
    id: `proliner-stairs-app-p${pageNum}`,
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
    id: `proliner-stairs-app-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages,
    videoUrl: primaryVideo,
    images: [],
    pdfUrl: options?.includePdf ? PROLINER_STAIRS_APP_MANUAL_PDF : undefined,
    pdfFileName: options?.includePdf
      ? 'APLICATIE-PROLINER-SCARI-Manual-artGRANIT.pdf'
      : undefined,
  };
}

/** Capitol 1 = PDF complet. Capitolele 2–6 = pagini manual (fără copertă, cuprins, contact). */
export const PROLINER_STAIRS_APP_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Manual de instruire', 'Descărcare manual complet PDF — offline', [], { includePdf: true }),
  chapter(2, 'Informații generale', 'Confidențialitate și drepturi de autor', [2]),
  chapter(3, 'Aplicația Proliner Stairs', 'Rezumat aplicație și setări măsurare', [4, 5]),
  chapter(4, 'Editare și proiectare', 'Editare, identificare, linie ajustare și măsurare', [6]),
  chapter(5, 'Model și verificare', 'Model interactiv, verificare potrivire și finalizare', [7, 8]),
  chapter(6, 'Setări generale', 'Profil treaptă, schițe contratrepte și constrângeri', [9]),
];

export const PROLINER_STAIRS_APP_MANUAL_URL = PROLINER_STAIRS_APP_MANUAL_PDF;
