import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProfilePhotoCropModal } from '@/components/angajat/ProfilePhotoCropModal';
import { profileInitials, validateProfileImageFile } from '@/lib/profilePhoto';
import { readFileAsDataUrl } from '@/lib/profilePhotoCrop';

interface EmployeeProfilePhotoProps {
  displayName: string;
  photoUrl?: string;
  editable?: boolean;
  onPhotoChange: (photoUrl: string | undefined) => void | Promise<void>;
  /** header = lângă nume în antetul panoului; card = bloc mare în conținut */
  variant?: 'header' | 'card';
}

export function EmployeeProfilePhoto({
  displayName,
  photoUrl,
  editable = false,
  onPhotoChange,
  variant = 'card',
}: EmployeeProfilePhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState('');

  const initials = profileInitials(displayName);
  const isHeader = variant === 'header';

  const openFilePicker = () => inputRef.current?.click();

  const openEditor = (src: string) => {
    setCropSrc(src);
    setCropOpen(true);
    setError(null);
  };

  const handleAvatarClick = () => {
    if (!editable || loading) return;
    if (photoUrl) openEditor(photoUrl);
    else openFilePicker();
  };

  const handleFile = async (file: File) => {
    setError(null);
    try {
      validateProfileImageFile(file);
      const dataUrl = await readFileAsDataUrl(file);
      openEditor(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nu s-a putut încărca poza.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleSaveCrop = async (dataUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      await onPhotoChange(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nu s-a putut salva poza.');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    const ok = window.confirm('Ștergeți poza de profil?');
    if (!ok) return;
    setCropOpen(false);
    setLoading(true);
    setError(null);
    try {
      await onPhotoChange(undefined);
    } finally {
      setLoading(false);
    }
  };

  const avatar = (
    <div className="relative shrink-0">
      <div
        className={[
          isHeader
            ? 'h-10 w-10 rounded-xl ring-1 ring-slate-200 bg-slate-100'
            : 'h-24 w-24 rounded-2xl ring-2 ring-corporate-border bg-corporate-surface',
          'overflow-hidden flex items-center justify-center',
          editable && !loading ? 'group cursor-pointer' : '',
          error ? 'ring-red-300' : '',
        ].join(' ')}
        title={error ?? (editable ? 'Apăsați pentru a adăuga sau ajusta poza' : undefined)}
        onClick={isHeader ? handleAvatarClick : undefined}
        onKeyDown={
          isHeader && editable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAvatarClick();
                }
              }
            : undefined
        }
        role={isHeader && editable ? 'button' : undefined}
        tabIndex={isHeader && editable ? 0 : undefined}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover object-center" />
        ) : (
          <span
            className={[
              'font-semibold text-slate-500 select-none',
              isHeader ? 'text-[11px]' : 'text-2xl text-corporate-muted',
            ].join(' ')}
          >
            {initials}
          </span>
        )}
        {editable && !loading && !isHeader && (
          <button
            type="button"
            onClick={handleAvatarClick}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
            aria-label="Ajustează poza de profil"
          >
            <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-medium uppercase tracking-wide px-2 text-center">
              Ajustează
            </span>
          </button>
        )}
        {editable && !loading && isHeader && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors pointer-events-none"
            aria-hidden
          >
            <svg
              className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <span className="text-[10px] text-corporate-muted">…</span>
          </div>
        )}
      </div>
    </div>
  );

  const fileInput = editable ? (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/*"
      className="sr-only"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) void handleFile(file);
      }}
    />
  ) : null;

  const cropModal = (
    <ProfilePhotoCropModal
      open={cropOpen}
      imageSrc={cropSrc}
      hasExistingPhoto={!!photoUrl}
      onClose={() => setCropOpen(false)}
      onSave={handleSaveCrop}
      onDelete={photoUrl ? () => void handleRemove() : undefined}
      onPickNewFile={() => {
        setCropOpen(false);
        openFilePicker();
      }}
    />
  );

  if (isHeader) {
    return (
      <>
        {avatar}
        {fileInput}
        {cropModal}
      </>
    );
  }

  return (
    <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
      {avatar}
      {fileInput}
      {cropModal}
      {editable && (
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={handleAvatarClick}>
            {photoUrl ? 'Ajustează poza' : 'Adaugă poză'}
          </Button>
          {photoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => void handleRemove()}
            >
              Șterge
            </Button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600 max-w-[12rem] text-center sm:text-left">{error}</p>}
    </div>
  );
}
