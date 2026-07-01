import { useState } from 'react';
import { useUsers } from '@/context/UsersContext';
import { isSupabaseConfigured } from '@/store/storage';
import { syncAllTraineesToCloud } from '@/lib/authService';
import { syncHrPerformanceWithCloud } from '@/lib/hrPerformanceSync';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function CloudSyncPanel() {
  const { allTrainees } = useUsers();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<'progress' | 'hr' | 'all' | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <Card padding="sm" className="border-slate-200 bg-slate-50/50">
        <h2 className="text-sm font-semibold text-corporate-dark">Sincronizare cloud</h2>
        <p className="text-xs text-corporate-muted mt-1">
          Configurați Supabase în .env.local. Rulați și{' '}
          <code className="bg-slate-100 px-1 rounded">supabase/schema-hr-performance.sql</code>.
        </p>
      </Card>
    );
  }

  const syncProgress = async () => {
    setLoading('progress');
    setStatus(null);
    try {
      const count = await syncAllTraineesToCloud(allTrainees.map((s) => s.id));
      setStatus(`Progres instruire: ${count}/${allTrainees.length} angajați sincronizați.`);
    } catch {
      setStatus('Eroare sync progres. Verificați Supabase.');
    } finally {
      setLoading(null);
    }
  };

  const syncHr = async () => {
    setLoading('hr');
    setStatus(null);
    try {
      const result = await syncHrPerformanceWithCloud();
      const labels: Record<string, string> = {
        pushed: 'Date HR trimise în cloud.',
        pulled: 'Date HR încărcate din cloud.',
        merged: 'Date HR îmbinate (local + cloud).',
        skipped: 'Sync HR omis — verificați tabelul hr_performance.',
      };
      setStatus(labels[result] ?? result);
    } catch {
      setStatus('Eroare sync HR. Rulați schema-hr-performance.sql în Supabase.');
    } finally {
      setLoading(null);
    }
  };

  const syncAll = async () => {
    setLoading('all');
    setStatus(null);
    try {
      const count = await syncAllTraineesToCloud(allTrainees.map((s) => s.id));
      const hrResult = await syncHrPerformanceWithCloud();
      setStatus(`Complet: progres ${count}/${allTrainees.length} · HR: ${hrResult}`);
    } catch {
      setStatus('Eroare sincronizare completă.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-corporate-dark mb-1">Sincronizare cloud Supabase</h2>
      <p className="text-sm text-corporate-muted mb-4">
        Progres instruire + date performanță HR (profile, evaluări, erori, KPI). Documentele scanate rămân
        local (IndexedDB) — doar metadata se sincronizează.
      </p>
      {status && (
        <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-800">
          {status}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" type="button" onClick={syncProgress} disabled={!!loading}>
          {loading === 'progress' ? '…' : 'Sync progres instruire'}
        </Button>
        <Button variant="secondary" size="sm" type="button" onClick={syncHr} disabled={!!loading}>
          {loading === 'hr' ? '…' : 'Sync date HR'}
        </Button>
        <Button variant="primary" size="sm" type="button" onClick={syncAll} disabled={!!loading}>
          {loading === 'all' ? 'Se sincronizează…' : 'Sync complet → cloud'}
        </Button>
      </div>
    </Card>
  );
}
