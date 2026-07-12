import type { EquipmentChapter, EquipmentManualPage, EquipmentSafetyWarning } from '@/data/equipmentOperations';
import { PROLINER_REMOTE_PAGE_HOTSPOTS } from '@/data/prolinerRemotePageHotspots';

const PROLINER_REMOTE_MANUAL_PDF = '/docs/equipment/proliner-remote-manual-ro.pdf';
const PAGE = (n: number) => `/docs/equipment/proliner-remote/pages/page-${String(n).padStart(2, '0')}.png`;

export const PROLINER_REMOTE_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță',
  content: `## Responsabilitate operator

Telecomanda Proliner permite controlul de la distanță — operatorul rămâne responsabil pentru siguranța zonei de măsurare.

## Reguli critice

- **Nimeni nu are voie** să se apropie de cablu sau cutia de comandă cât timp stiloul este în uz.
- În caz de interferență semnal, folosiți aplicația Android PROLINER Remote Control.
- Permiteți **numai personalului instruit** să opereze telecomanda.`,
};

function manualPage(pageNum: number): EquipmentManualPage {
  const spots = PROLINER_REMOTE_PAGE_HOTSPOTS[pageNum];
  const primaryVideo = spots?.[0]?.videoUrl;
  return {
    id: `proliner-remote-p${pageNum}`,
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
    id: `proliner-remote-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages,
    videoUrl: primaryVideo,
    images: [],
    pdfUrl: options?.includePdf ? PROLINER_REMOTE_MANUAL_PDF : undefined,
    pdfFileName: options?.includePdf
      ? 'PROLINER-Telecomanda-Manual-artGRANIT.pdf'
      : undefined,
  };
}

/** Capitol 1 = PDF complet. Capitolele 2–4 = pagini manual. */
export const PROLINER_REMOTE_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Manual de instruire', 'Descărcare manual complet PDF — offline', [], { includePdf: true }),
  chapter(2, 'Informații generale', 'Confidențialitate și prezentare telecomandă', [2]),
  chapter(3, 'Utilizare telecomandă', 'Fila Telecomandă și butoane principale', [3, 4]),
  chapter(4, 'Aplicație Android', 'PROLINER Remote Control — descărcare și videoclip', [5]),
];

export const PROLINER_REMOTE_MANUAL_URL = PROLINER_REMOTE_MANUAL_PDF;
