/** Surse responsive pentru paginile PNG de manual (full + -sm pe mobil). */

const PAGE_PNG = /^(.*\/page-\d{2})\.png$/i;

export function manualPageSmUrl(imageUrl: string): string | null {
  const m = imageUrl.match(PAGE_PNG);
  return m ? `${m[1]}-sm.png` : null;
}

/** srcSet + sizes: pe telefon/tabletă browserul alege varianta -sm (~1400w). */
export function manualPageImageSources(imageUrl: string): {
  src: string;
  srcSet?: string;
  sizes?: string;
} {
  const sm = manualPageSmUrl(imageUrl);
  if (!sm) return { src: imageUrl };
  return {
    src: imageUrl,
    srcSet: `${sm} 1400w, ${imageUrl} 2800w`,
    sizes: '(max-width: 1023px) 100vw, min(96vw, 920px)',
  };
}
