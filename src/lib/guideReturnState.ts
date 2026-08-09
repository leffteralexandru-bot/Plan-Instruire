/** Stare ghid ca să te întorci exact pe pagina/poziția de unde ai deschis linkul. */

export type GuideReturnSnapshot = {
  ghid: 'teren' | 'proiectare';
  tip: string;
  chapterId: string | null;
  pageId: string | null;
  scrollY: number;
};

const STORAGE_KEY = 'artgranit-guide-return-v1';

export function saveGuideReturnSnapshot(snapshot: GuideReturnSnapshot): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* private mode / quota */
  }
}

export function peekGuideReturnSnapshot(): GuideReturnSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuideReturnSnapshot;
  } catch {
    return null;
  }
}

/** Citește și șterge (o singură restaurare). */
export function consumeGuideReturnSnapshot(): GuideReturnSnapshot | null {
  const snap = peekGuideReturnSnapshot();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return snap;
}

export function guidePageDomId(pageId: string): string {
  return `guide-page-${pageId}`;
}
