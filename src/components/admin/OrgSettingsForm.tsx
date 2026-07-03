import { useState } from 'react';
import type { OrgSettings } from '@/types';
import { getDefaultOrgSettings } from '@/data/orgSettings';
import { COHORTS } from '@/data/cohorts';
import { storage } from '@/store/storage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function OrgSettingsForm() {
  const current = storage.getSettings();
  const [settings, setSettings] = useState<OrgSettings>(current);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.programVersion.trim()) {
      setError('Versiunea programului este obligatorie.');
      return;
    }
    storage.saveSettings({
      programVersion: settings.programVersion.trim(),
      activeCohortId: settings.activeCohortId,
    });
    setError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setSettings(getDefaultOrgSettings());
    setError(null);
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Setări organizație artGRANIT</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Configurare locală (browser) — versiune program și grupă activă.
      </p>

      {saved && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Setări salvate.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 max-w-lg">
        <Input
          id="programVersion"
          label="Versiune program instruire"
          value={settings.programVersion}
          onChange={(e) => setSettings((s) => ({ ...s, programVersion: e.target.value }))}
          placeholder="2026.1"
          required
        />
        <div className="space-y-1.5">
          <label htmlFor="activeCohortId" className="block text-sm font-medium text-slate-700">
            Grupă activă
          </label>
          <select
            id="activeCohortId"
            value={settings.activeCohortId ?? COHORTS[0].id}
            onChange={(e) => setSettings((s) => ({ ...s, activeCohortId: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
          >
            {COHORTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} (v{c.programVersion})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" size="sm">
            Salvează setări
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
            Resetează la implicit
          </Button>
        </div>
      </form>

      <p className="text-xs text-slate-400 mt-4">
        Supabase cloud: configurați <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> și{' '}
        <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> în .env.local (vezi supabase/README.md).
      </p>
    </Card>
  );
}
