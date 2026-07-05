export const PROFILE_PHOTO_OUTPUT_SIZE = 512;
export const PROFILE_PHOTO_CROP_VIEW_SIZE = 280;

export interface ProfilePhotoCropTransform {
  /** Multiplicator peste scala „cover” (1 = încadrare minimă) */
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export function getCoverScale(
  imageWidth: number,
  imageHeight: number,
  cropSize: number,
): number {
  return Math.max(cropSize / imageWidth, cropSize / imageHeight);
}

export function clampCropOffset(
  imageWidth: number,
  imageHeight: number,
  cropSize: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
): { offsetX: number; offsetY: number } {
  const base = getCoverScale(imageWidth, imageHeight, cropSize);
  const scale = base * zoom;
  const displayW = imageWidth * scale;
  const displayH = imageHeight * scale;

  const maxX = Math.max(0, (displayW - cropSize) / 2);
  const maxY = Math.max(0, (displayH - cropSize) / 2);

  return {
    offsetX: Math.min(maxX, Math.max(-maxX, offsetX)),
    offsetY: Math.min(maxY, Math.max(-maxY, offsetY)),
  };
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Nu s-a putut încărca imaginea.'));
    img.src = src;
  });
}

export function exportProfilePhotoCrop(
  img: HTMLImageElement,
  transform: ProfilePhotoCropTransform,
  cropSize = PROFILE_PHOTO_CROP_VIEW_SIZE,
  outputSize = PROFILE_PHOTO_OUTPUT_SIZE,
): string {
  const { zoom } = transform;
  const { offsetX, offsetY } = clampCropOffset(
    img.naturalWidth,
    img.naturalHeight,
    cropSize,
    zoom,
    transform.offsetX,
    transform.offsetY,
  );

  const baseScale = getCoverScale(img.naturalWidth, img.naturalHeight, cropSize);
  const totalScale = baseScale * zoom;
  const displayW = img.naturalWidth * totalScale;
  const displayH = img.naturalHeight * totalScale;
  const left = (cropSize - displayW) / 2 + offsetX;
  const top = (cropSize - displayH) / 2 + offsetY;

  const sourceX = -left / totalScale;
  const sourceY = -top / totalScale;
  const sourceSize = cropSize / totalScale;

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nu s-a putut procesa imaginea.');

  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize,
  );

  return canvas.toDataURL('image/jpeg', 0.88);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Nu s-a putut citi fișierul.'));
    };
    reader.onerror = () => reject(new Error('Nu s-a putut citi fișierul.'));
    reader.readAsDataURL(file);
  });
}
