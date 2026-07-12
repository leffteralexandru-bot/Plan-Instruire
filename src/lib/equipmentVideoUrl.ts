export function isLocalEquipmentVideo(url: string): boolean {
  const trimmed = url.trim();
  return /\.(mp4|webm|ogg)(\?|$)/i.test(trimmed) || trimmed.startsWith('/');
}

export function isYoutubeVideo(url: string): boolean {
  const trimmed = url.trim();
  return (
    trimmed.includes('youtube.com/') ||
    trimmed.includes('youtu.be/')
  );
}

export function hasEquipmentVideo(url?: string): boolean {
  if (!url?.trim()) return false;
  return isLocalEquipmentVideo(url) || isYoutubeVideo(url);
}

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const clean = url.trim();
    if (clean.includes('youtube.com/watch') || clean.includes('youtube.com/live')) {
      const id = new URL(clean).searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (clean.includes('youtu.be/')) {
      const id = clean.split('youtu.be/')[1]?.split(/[?#]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (clean.includes('youtube.com/embed/')) return clean;
  } catch {
    return null;
  }
  return null;
}
