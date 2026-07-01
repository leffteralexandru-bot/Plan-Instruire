import { useRef, useState } from 'react';
import { storage } from '@/store/storage';
import { buildBackup, downloadBackupJson, readBackupFile } from '@/lib/dataBackup';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DataBackupPanelProps {
  onRestored: () => void;
}

export function DataBackupPanel({ onRestored }: DataBackupPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleExport = () => {
    const backup = buildBackup(() => storage.getAllProgress(), () => storage.getSettings());
    downloadBackupJson(backup);
    setMessage({ type: 'ok', text: 'Backup JSON descărcat.' });
  };

  const handleImport = async (file: File) => {
    try {
      const backup = await readBackupFile(file);
      storage.importAllProgress(backup.progress);
      storage.saveSettings(backup.settings);
      setMessage({ type: 'ok', text: 'Backup restaurat cu succes. Reîncărcați pagina dacă e necesar.' });
      onRestored();
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Eroare la import backup.',
      });
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Backup & restaurare date</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Export/import JSON — progres stagiari și setări artGRANIT. Util pentru migrare browser sau arhivă HR.
      </p>

      {message && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm border ${
            message.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" type="button" onClick={handleExport}>
          Export backup JSON
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={() => inputRef.current?.click()}>
          Import backup JSON
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = '';
          }}
        />
      </div>
    </Card>
  );
}
