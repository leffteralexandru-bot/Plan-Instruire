/** Videoclipuri Proliner stocate local (public/docs/equipment/proliner/videos/). */
const VIDEO = (page: number) => `/docs/equipment/proliner/videos/page-${String(page).padStart(2, '0')}.mp4`;

export const PROLINER_LOCAL_VIDEOS: Record<number, string> = {
  5: VIDEO(5),
  6: VIDEO(6),
  9: VIDEO(9),
  10: VIDEO(10),
  11: VIDEO(11),
  12: VIDEO(12),
  13: VIDEO(13),
  14: VIDEO(14),
  15: VIDEO(15),
  16: VIDEO(16),
};
