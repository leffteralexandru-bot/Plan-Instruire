import type { EquipmentChapter, EquipmentManualPage, EquipmentSafetyWarning } from '@/data/equipmentOperations';
import { PRODIM_CT_PAGE_HOTSPOTS } from '@/data/prodimCtPageHotspots';

const PRODIM_CT_MANUAL_PDF = '/docs/equipment/prodim-ct-manual-ro.pdf';
const PAGE = (n: number) => `/docs/equipment/prodim-ct/pages/page-${String(n).padStart(2, '0')}.png`;

export const PRODIM_CT_SAFETY_WARNING: EquipmentSafetyWarning = {
  title: 'Avertisment Siguranță',
  content: `## Responsabilitate operator

Operatorul este responsabil pentru parametrii de măsurare, compensare și proiecție înainte de fiecare sesiune.

## Reguli critice

- **Nimeni nu are voie** să se apropie de cablu sau de cutia de comandă cât timp stiloul este în uz.
- Planificați poziționarea Proliner-ului astfel încât cablul să nu fie îndoit în timpul măsurătorii.
- Verificați parametrii (pointer, contur, proiecție, compensare) înainte de pornirea măsurătorii.
- Permiteți **numai personalului instruit** să lucreze cu Prodim CT și Proliner.`,
};

function manualPage(pageNum: number): EquipmentManualPage {
  const spots = PRODIM_CT_PAGE_HOTSPOTS[pageNum];
  const primaryVideo = spots?.[0]?.videoUrl;
  return {
    id: `prodim-ct-p${pageNum}`,
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
    id: `prodim-ct-ch-${number}`,
    number,
    title,
    summary,
    content: '',
    steps: [],
    pages,
    videoUrl: primaryVideo,
    images: [],
    pdfUrl: options?.includePdf ? PRODIM_CT_MANUAL_PDF : undefined,
    pdfFileName: options?.includePdf
      ? 'Manual-Prodim-CT-3.2-3.3-artGRANIT.pdf'
      : undefined,
  };
}

/**
 * Capitol 1 = doar PDF (manual complet).
 * Capitolele 2–11 = pagini din manual (fără copertă și cuprins).
 */
export const PRODIM_CT_CHAPTERS: EquipmentChapter[] = [
  chapter(1, 'Manual de instruire', 'Descărcare manual complet PDF — offline', [], { includePdf: true }),
  chapter(2, 'Punerea în funcțiune', 'Telecomandă Proliner și ecran principal', [3]),
  chapter(3, 'Parametri generali', 'Pointer, contur, proiecție și compensare', [4, 5, 6, 7, 8]),
  chapter(4, 'Măsurare', 'Pornire, verificare parametri și flux de măsurare', [9]),
  chapter(5, 'Deplasarea Proliner-ului', 'Poziționare și leap între zone', [10]),
  chapter(6, 'Verificare și editare', 'Verificare măsurători și butoane de editare', [11]),
  chapter(7, 'Editare — selecție și dimensiuni', 'Selecție, control dimensiuni și editare (părți 1–2)', [12, 13]),
  chapter(8, 'Editare — desen', 'Opțiuni de desen și funcții speciale', [14]),
  chapter(9, 'MODUL CT — introducere', 'Sumar modul CT și funcții speciale', [15]),
  chapter(10, 'MODUL CT — editare', 'Dimensiuni, profile, materiale și desen', [16, 17]),
  chapter(11, 'MODUL CT — schiță și raport', 'Schiță, editare și raport PDF', [18, 19, 20]),
];

export const PRODIM_CT_MANUAL_URL = PRODIM_CT_MANUAL_PDF;
