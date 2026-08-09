/** Prioritize first chapter page or the page targeted by `?page=` deep-link. */
export function shouldPrioritizeManualPage(
  pageId: string | undefined,
  indexInChapter: number,
  pageQuery: string | null,
): boolean {
  if (pageId && pageQuery && pageId === pageQuery) return true;
  if (!pageQuery && indexInChapter === 0) return true;
  return false;
}
