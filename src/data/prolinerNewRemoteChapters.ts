import type { EquipmentChapter, EquipmentManualPage, EquipmentSafetyWarning } from '@/data/equipmentOperations';
import { PROLINER_NEW_REMOTE_PAGE_HOTSPOTS } from '@/data/prolinerNewRemotePageHotspots';

const PROLINER_NEW_REMOTE_MANUAL_PDF = '/docs/equipment/proliner-new-remote-manual-ro.pdf';
const PAGE = (n: number) =>
  `/docs/equipment/proliner-new-remote/pages/page-${String(n).padStart(2, '0')}.png`;

export const PROLINER_NEW_REMOTE_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță',
  content: `## Responsabilitate operator

Programarea telecomenzii se face din meniul Diagnosticare — operatorul rămâne responsabil pentru siguranța zonei de măsurare.

## Reguli critice

- **Nimeni nu are voie** să se apropie de cablu sau cutia de comandă cât timp stiloul este în uz.
- Respectați secvența corectă de apăsare a butoanelor la programare (1 → 2 → 3).
- Permiteți **numai personalului instruit** să programeze sau să verifice telecomanda.`,
};

function manualPage(pageNum: number): EquipmentManualPage {
  const spots = PROLINER_NEW_REMOTE_PAGE_HOTSPOTS[pageNum];
  const primaryVideo = spots?.[0]?.videoUrl;
  return {
    id: `proliner-new-remote-p${pageNum}`,
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
    id: `proliner-new-remote-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages,
    videoUrl: primaryVideo,
    images: [],
    pdfUrl: options?.includePdf ? PROLINER_NEW_REMOTE_MANUAL_PDF : undefined,
    pdfFileName: options?.includePdf
      ? 'CT-3.1-TELECOMANDA-NOUA-Manual-artGRANIT.pdf'
      : undefined,
  };
}

/** Capitol 1 = PDF complet. Capitolele 2–3 = pagini manual (fără copertă și contact). */
export const PROLINER_NEW_REMOTE_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Manual de instruire', 'Descărcare manual complet PDF — offline', [], { includePdf: true }),
  chapter(2, 'Informații generale', 'Confidențialitate și responsabilitate operator', [2]),
  chapter(3, 'Telecomandă nouă', 'Programare și verificare telecomandă Proliners 7, 8 & 10', [3]),
];

export const PROLINER_NEW_REMOTE_MANUAL_URL = PROLINER_NEW_REMOTE_MANUAL_PDF;
