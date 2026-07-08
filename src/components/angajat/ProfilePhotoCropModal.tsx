import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/Button';
import {
  PROFILE_PHOTO_CROP_VIEW_SIZE,
  clampCropOffset,
  exportProfilePhotoCrop,
  getCoverScale,
  loadImageElement,
  type ProfilePhotoCropTransform,
} from '@/lib/profilePhotoCrop';

interface ProfilePhotoCropModalProps {
  open: boolean;
  imageSrc: string;
  hasExistingPhoto?: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onPickNewFile: () => void;
}

export function ProfilePhotoCropModal({
  open,
  imageSrc,
  hasExistingPhoto,
  onClose,
  onSave,
  onDelete,
  onPickNewFile,
}: ProfilePhotoCropModalProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<ProfilePhotoCropTransform>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !imageSrc) return;
    setTransform({ zoom: 1, offsetX: 0, offsetY: 0 });
    setError(null);
    loadImageElement(imageSrc)
      .then(setImg)
      .catch((e) => setError(e instanceof Error ? e.message : 'Eroare imagine'));
  }, [open, imageSrc]);

  const applyOffset = useCallback(
    (nextX: number, nextY: number) => {
      if (!img) return;
      const clamped = clampCropOffset(
        img.naturalWidth,
        img.naturalHeight,
        PROFILE_PHOTO_CROP_VIEW_SIZE,
        transform.zoom,
        nextX,
        nextY,
      );
      setTransform((t) => ({ ...t, ...clamped }));
    },
    [img, transform.zoom],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: transform.offsetX,
      oy: transform.offsetY,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    applyOffset(dragRef.current.ox + dx, dragRef.current.oy + dy);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleZoom = (zoom: number) => {
    if (!img) return;
    const clamped = clampCropOffset(
      img.naturalWidth,
      img.naturalHeight,
      PROFILE_PHOTO_CROP_VIEW_SIZE,
      zoom,
      transform.offsetX,
      transform.offsetY,
    );
    setTransform({ zoom, ...clamped });
  };

  const handleSave = async () => {
    if (!img) return;
    setSaving(true);
    setError(null);
    try {
      const dataUrl = exportProfilePhotoCrop(img, transform);
      await onSave(dataUrl);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nu s-a putut salva poza.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const cropSize = PROFILE_PHOTO_CROP_VIEW_SIZE;
  let previewStyle: CSSProperties | null = null;

  if (img) {
    const base = getCoverScale(img.naturalWidth, img.naturalHeight, cropSize);
    const scale = base * transform.zoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const left = (cropSize - w) / 2 + transform.offsetX;
    const top = (cropSize - h) / 2 + transform.offsetY;
    previewStyle = {
      position: 'absolute',
      left,
      top,
      width: w,
      height: h,
      maxWidth: 'none',
      userSelect: 'none',
      touchAction: 'none',
    };
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 transition-all duration-300 @md:items-center @md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-crop-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Închide"
        onClick={onClose}
      />
      <div className="relative z-10 h-[100dvh] w-full overflow-y-auto rounded-none border border-corporate-border bg-white p-4 shadow-xl transition-all duration-300 @md:h-auto @md:max-w-md @md:rounded-xl @md:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="profile-crop-title" className="text-base font-semibold text-corporate-dark">
              Ajustează poza de profil
            </h2>
            <p className="text-xs text-corporate-muted mt-1">
              Trageți imaginea și folosiți zoom-ul ca să încapă simetric în pătrat.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Închide
          </Button>
        </div>

        <div
          className="relative mx-auto rounded-2xl overflow-hidden bg-corporate-surface ring-2 ring-corporate-border cursor-grab active:cursor-grabbing"
          style={{ width: cropSize, height: cropSize }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {img && previewStyle ? (
            <img src={imageSrc} alt="" draggable={false} style={previewStyle} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-corporate-muted">
              Se încarcă…
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40 rounded-2xl"
            aria-hidden
          />
        </div>

        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-3 text-sm text-corporate-dark">
            <span className="shrink-0 text-xs font-medium text-corporate-muted w-14">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={transform.zoom}
              onChange={(e) => handleZoom(Number(e.target.value))}
              className="flex-1 accent-corporate-gold"
            />
            <span className="text-xs tabular-nums text-corporate-muted w-10 text-right">
              {Math.round(transform.zoom * 100)}%
            </span>
          </label>
        </div>

        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-corporate-border">
          <Button type="button" onClick={() => void handleSave()} disabled={!img || saving}>
            {saving ? 'Se salvează…' : 'Salvează poza'}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onPickNewFile}>
            Altă poză
          </Button>
          {hasExistingPhoto && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                void (async () => {
                  if (onDelete) await onDelete();
                  onClose();
                })();
              }}
            >
              Șterge
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
