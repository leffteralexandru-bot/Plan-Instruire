import { useRef, useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { useStagiarId } from '@/hooks/useStagiarId';
import { useDayPhotos } from '@/hooks/useDayPhotos';
import { photoStore } from '@/store/photoStore';
import { compressImage } from '@/lib/progressLogic';
import { uploadPhotoToCloud } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/store/storage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PhotoUploadProps {
  dayId: string;
  readOnly?: boolean;
}

export function PhotoUpload({ dayId, readOnly }: PhotoUploadProps) {
  const userId = useStagiarId();
  const { savePhoto } = useProgress();
  const { photos, loading, refresh } = useDayPhotos(dayId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('Măsurători / șantier');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    setError('');
    try {
      const blob = await compressImage(file);
      const id = `photo-${Date.now()}`;
      const createdAt = new Date().toISOString();

      await photoStore.save({
        id,
        dayId,
        userId,
        label: label || 'Șantier',
        blob,
        createdAt,
        synced: false,
      });

      savePhoto({ id, dayId, label: label || 'Șantier', synced: false });

      if (navigator.onLine && isSupabaseConfigured()) {
        const url = await uploadPhotoToCloud(userId, id, blob);
        if (url) await photoStore.markSynced(id);
      }

      refresh();
      setLabel('Măsurători / șantier');
    } catch {
      setError('Nu s-a putut procesa imaginea. Încercați din nou.');
    } finally {
      setUploading(false);
    }
  };

  if (readOnly && photos.length === 0 && !loading) return null;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Fotografii șantier</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Compresie automată · IndexedDB · sync cloud când e online
      </p>

      {!readOnly && (
        <div className="space-y-3 mb-4">
          <Input
            id="photo-label"
            label="Descriere poză"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ex. Unghi atipic colț stânga"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Se procesează...' : 'Adaugă fotografie'}
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}

      {loading && <p className="text-sm text-corporate-muted">Se încarcă pozele...</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((p) => (
            <figure key={p.id} className="rounded-xl overflow-hidden border border-slate-100">
              <img src={p.url} alt={p.label} className="w-full h-28 object-cover" loading="lazy" />
              <figcaption className="text-xs p-2 text-corporate-muted truncate flex justify-between gap-1">
                <span className="truncate">{p.label}</span>
                {!p.synced && <span className="text-amber-600 shrink-0">local</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Card>
  );
}
