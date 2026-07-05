import { compressImage } from '@/lib/progressLogic';

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Nu s-a putut citi imaginea.'));
    };
    reader.onerror = () => reject(new Error('Nu s-a putut citi imaginea.'));
    reader.readAsDataURL(blob);
  });
}

export function validateProfileImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selectați un fișier imagine (JPG, PNG, WebP).');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Imaginea este prea mare (maxim 8 MB).');
  }
}

/** Compresie simplă fără decupaj — folosit doar dacă e nevoie în altă parte */
export async function compressProfilePhoto(file: File): Promise<string> {
  validateProfileImageFile(file);
  const blob = await compressImage(file, 512, 0.82);
  return blobToDataUrl(blob);
}

export function profileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}
