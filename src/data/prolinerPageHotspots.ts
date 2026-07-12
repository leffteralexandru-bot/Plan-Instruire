import { PROLINER_LOCAL_VIDEOS } from '@/data/prolinerVideos';

/** Zone click video = doar miniatura (poza video), nu textul „Urmăriți videoclipul”. */
export const PROLINER_PAGE_HOTSPOTS: Record<
  number,
  { videoUrl: string; x: number; y: number; w: number; h: number }
> = {
  5: { videoUrl: PROLINER_LOCAL_VIDEOS[5], x: 7.6, y: 75.38, w: 28.94, h: 13.04 },
  6: { videoUrl: PROLINER_LOCAL_VIDEOS[6], x: 7.6, y: 71.77, w: 28.94, h: 13.04 },
  9: { videoUrl: PROLINER_LOCAL_VIDEOS[9], x: 7.71, y: 70.37, w: 28.83, h: 13.04 },
  10: { videoUrl: PROLINER_LOCAL_VIDEOS[10], x: 7.43, y: 74.66, w: 28.94, h: 13.04 },
  11: { videoUrl: PROLINER_LOCAL_VIDEOS[11], x: 7.43, y: 73.71, w: 28.94, h: 13.04 },
  12: { videoUrl: PROLINER_LOCAL_VIDEOS[12], x: 7.6, y: 73.81, w: 28.94, h: 13.04 },
  13: { videoUrl: PROLINER_LOCAL_VIDEOS[13], x: 7.6, y: 73.07, w: 28.94, h: 13.04 },
  14: { videoUrl: PROLINER_LOCAL_VIDEOS[14], x: 63.29, y: 72.67, w: 28.94, h: 13.04 },
  15: { videoUrl: PROLINER_LOCAL_VIDEOS[15], x: 7.43, y: 70.95, w: 28.94, h: 13.04 },
  16: { videoUrl: PROLINER_LOCAL_VIDEOS[16], x: 63.12, y: 74.09, w: 28.94, h: 13.04 },
};
