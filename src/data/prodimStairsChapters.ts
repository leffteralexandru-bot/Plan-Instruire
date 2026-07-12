import type { EquipmentChapter, EquipmentManualPage, EquipmentSafetyWarning } from '@/data/equipmentOperations';
import { PRODIM_STAIRS_PAGE_HOTSPOTS } from '@/data/prodimStairsPageHotspots';

const PRODIM_STAIRS_MANUAL_PDF = '/docs/equipment/prodim-stairs-manual-ro.pdf';
const PAGE = (n: number) => `/docs/equipment/prodim-stairs/pages/page-${String(n).padStart(2, '0')}.png`;

export const PRODIM_STAIRS_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță',
  content: `## Responsabilitate operator

Măsurarea scărilor cu Prodim Stairs necesită respectarea protocolului ghidat și verificarea modelului înainte de raport.

## Reguli critice

- Configurați corect parametrii înainte de începerea măsurătorii.
- Repetați pașii de măsurare pentru fiecare treaptă conform software-ului ghidat.
- Verificați modelul 3D și raportul înainte de exportul către producție.`,
};

function manualPage(pageNum: number): EquipmentManualPage {
  const spots = PRODIM_STAIRS_PAGE_HOTSPOTS[pageNum];
  const primaryVideo = spots?.[0]?.videoUrl;
  return {
    id: `prodim-stairs-p${pageNum}`,
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
    id: `prodim-stairs-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages,
    videoUrl: primaryVideo,
    images: [],
    pdfUrl: options?.includePdf ? PRODIM_STAIRS_MANUAL_PDF : undefined,
    pdfFileName: options?.includePdf
      ? 'SCARI-PRODIM-Manual-artGRANIT.pdf'
      : undefined,
  };
}

/** Capitol 1 = PDF complet. Capitolele 2–6 = pagini manual (fără cuprins). */
export const PRODIM_STAIRS_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Manual de instruire', 'Descărcare manual complet PDF — offline', [], { includePdf: true }),
  chapter(2, 'Prodim Stairs', 'Soluția Stairs și prezentare generală', [3, 4]),
  chapter(3, 'Protocol — pregătire', 'Noțiuni introductive, configurare și pornire', [5, 6]),
  chapter(4, 'Măsurarea scărilor', 'Flux ghidat pas cu pas pentru fiecare treaptă', [7, 8, 9, 10, 11]),
  chapter(5, 'Verificare după măsurare', 'Model, verificare, finalizare și raport', [12, 13, 14, 15]),
  chapter(6, 'Setări proiecție', 'Proiecție cu 3 puncte și opțiuni suplimentare', [16, 17]),
];

export const PRODIM_STAIRS_MANUAL_URL = PRODIM_STAIRS_MANUAL_PDF;
