import { useState } from 'react';
import { STAGIARI } from '@/data/users';
import { isSupabaseConfigured } from '@/store/storage';
import { syncAllTraineesToCloud } from '@/lib/authService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function CloudSyncPanel() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <Card padding="sm" className="border-slate-200 bg-slate-50/50">
        <h2 className="text-sm font-semibold text-corporate-dark">Sincronizare cloud</h2>
        <p className="text-xs text-corporate-muted mt-1">
          Configurați Supabase în .env.local pentru sync multi-device.
        </p>
      </Card>
    );
  }

  const handleSyncAll = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const count = await syncAllTraineesToCloud(STAGIARI.map((s) => s.id));
      setStatus(`Sincronizat ${count}/${STAGIARI.length} stagiari în cloud.`);
    } catch {
      setStatus('Eroare la sincronizare. Verificați conexiunea și credențialele Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Sincronizare cloud Supabase</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Trimite progresul tuturor stagiarilor din acest browser către cloud. Recomandat înainte de schimbare
        dispozitiv sau raport HR centralizat.
      </p>
      {status && (
        <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-800">
          {status}
        </div>
      )}
      <Button variant="primary" size="sm" type="button" onClick={handleSyncAll} disabled={loading}>
        {loading ? 'Se sincronizează…' : 'Sync toate cohortele → cloud'}
      </Button>
    </Card>
  );
}
