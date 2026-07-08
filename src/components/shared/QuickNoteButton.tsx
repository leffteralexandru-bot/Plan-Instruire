import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/context/UsersContext';
import { useHrPerformance } from '@/hooks/useHrPerformance';
import { QUICK_NOTE_TYPE_LABELS } from '@/lib/hrPerformanceStore';
import type { QuickNoteType } from '@/types';

export function QuickNoteButton() {
  const { user, canManageUsers, isMentor } = useAuth();
  const { visibleTrainees } = useUsers();
  const { addQuickNote } = useHrPerformance();
  const [open, setOpen] = useState(false);
  const [angajatId, setAngajatId] = useState('');
  const [text, setText] = useState('');
  const [tip, setTip] = useState<QuickNoteType>('observatie');

  if (!user || (!canManageUsers && !isMentor)) return null;

  const targets = visibleTrainees.length
    ? visibleTrainees
    : [];

  const handleSave = () => {
    if (!angajatId || !text.trim()) return;
    addQuickNote({
      angajatId,
      autorId: user.id,
      autorNume: user.name,
      autorRol: user.roles.includes('hr') ? 'hr' : user.roles.includes('admin') ? 'admin' : 'mentor',
      text: text.trim(),
      tip,
    });
    setText('');
    setOpen(false);
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-white/80 hover:text-white hover:bg-white/10 hidden sm:inline-flex"
        onClick={() => setOpen(true)}
      >
        Observație
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 transition-all duration-300 @md:items-center @md:p-4">
      <div className="h-[100dvh] w-full overflow-y-auto rounded-none bg-white p-4 shadow-neural-lg transition-all duration-300 space-y-3 @md:h-auto @md:max-w-md @md:rounded-xl">
        <h3 className="font-semibold text-corporate-dark">Observație rapidă</h3>
        <select
          className="w-full rounded-lg border border-corporate-border px-3 py-2 text-sm"
          value={angajatId}
          onChange={(e) => setAngajatId(e.target.value)}
        >
          <option value="">Selectează angajat…</option>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {(['observatie', 'apreciere', 'atentionare'] as QuickNoteType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTip(t)}
              className={[
                'text-xs rounded-full px-2 py-1 border',
                tip === t ? 'border-corporate-gold' : 'border-corporate-border',
              ].join(' ')}
            >
              {QUICK_NOTE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <textarea
          className="w-full rounded-lg border border-corporate-border px-3 py-2 text-sm min-h-[80px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Notă scurtă…"
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Anulează
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={!angajatId || !text.trim()}>
            Salvează
          </Button>
        </div>
      </div>
    </div>
  );
}
